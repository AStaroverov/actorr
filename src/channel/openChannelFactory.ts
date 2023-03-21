import { Dispatch, EnvelopeTransmitter, ExtractEnvelopeIn, ExtractEnvelopeOut, Subscribe } from '../types';
import { createRequest } from '../request';
import { createResponseFactory } from '../response';
import { CHANNEL_CLOSE_TYPE, CHANNEL_OPEN_TYPE, ChannelCloseEnvelope } from './defs';
import { createEnvelope } from '../envelope';
import { noop, once } from '../utils';
import { OpenChanelContext } from './types';
import { createDispatch } from '../dispatch';
import { createSubscribe } from '../subscribe';

export function openChannelFactory<T extends EnvelopeTransmitter>(transmitter: T) {
    const request = createRequest(transmitter);
    const subscribe = createSubscribe(transmitter);
    const createResponse = createResponseFactory(createDispatch(transmitter));

    return function openChannel<In extends ExtractEnvelopeIn<T>, Out extends ExtractEnvelopeOut<T>>(
        envelope: ExtractEnvelopeOut<T>,
        onOpen: (context: OpenChanelContext<In, Out>) => void | Function,
    ) {
        const mapClose = new Map<string, Function>();
        const mapDispose = new Map<string, Function>();

        const createCloseChannel = (route: string, dispatch: Dispatch<Out>) =>
            once(() => {
                mapDispose.has(route) && mapDispose.get(route)!();

                mapClose.delete(route);
                mapDispose.delete(route);

                dispatch(createEnvelope(CHANNEL_CLOSE_TYPE, undefined));
            });

        const createSubscribeToChannel =
            (route: string): Subscribe<In> =>
            (callback, withSystemEnvelopes) =>
                subscribe(
                    (envelope) => envelope.routePassed === route && callback(envelope as In),
                    withSystemEnvelopes,
                );

        const closeRequestResponse = request(envelope, (envelope) => {
            const channelRoute = envelope.routePassed;

            if (channelRoute === undefined) {
                return;
            }

            if (envelope.type === CHANNEL_CLOSE_TYPE) {
                mapClose.has(channelRoute) && mapClose.get(channelRoute)!();
                return;
            }

            if (envelope.type === CHANNEL_OPEN_TYPE && !mapDispose.has(channelRoute)) {
                const dispatch = createResponse(envelope);
                const subscribe = createSubscribeToChannel(channelRoute);
                const close = createCloseChannel(channelRoute, dispatch);
                const dispose = onOpen({ dispatch, subscribe, close });

                mapClose.set(channelRoute, close);
                mapDispose.set(channelRoute, dispose ?? noop);
            }
        });

        return function closeOpenedChannels() {
            closeRequestResponse();

            for (const close of mapClose.values()) {
                close();
            }

            mapClose.clear();
            mapDispose.clear();
        };
    };
}
