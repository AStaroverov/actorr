import { Dispatch, EnvelopeTransmitter, ExtractEnvelopeIn, ExtractEnvelopeOut } from '../types';
import { createRequest } from '../request';
import { CHANNEL_CLOSE_TYPE, CHANNEL_OPEN_TYPE, ChannelOpenEnvelope } from './defs';
import { createEnvelope } from '../envelope';
import { call, noop, once } from '../utils';
import { OpenChanelContext } from './types';
import { createDispatch } from '../dispatch';
import { createSubscribe } from '../subscribe';

export function openChannelFactory<T extends EnvelopeTransmitter>(transmitter: T) {
    const request = createRequest(transmitter);

    return function openChannel<In extends ExtractEnvelopeIn<T>, Out extends ExtractEnvelopeOut<T>>(
        envelope: ExtractEnvelopeOut<T>,
        onOpen: (context: OpenChanelContext<In, Out>) => void | Function,
    ) {
        const mapDisposes = new Map<string, Function[]>();

        const createCloseChannel = (route: string, dispatch: Dispatch<Out>) =>
            once(() => {
                mapDisposes.has(route) && mapDisposes.get(route)!.forEach(call);
                mapDisposes.delete(route);
                dispatch(createEnvelope(CHANNEL_CLOSE_TYPE, undefined));
            });

        const closeRequestResponse = request(envelope, (envelope) => {
            const channelRoute = envelope.routePassed;

            if (channelRoute === undefined) {
                return;
            }

            if (envelope.type === CHANNEL_OPEN_TYPE && !mapDisposes.has(channelRoute)) {
                const port = (envelope as ChannelOpenEnvelope).payload;

                port.start();

                const dispatch = createDispatch(port);
                const subscribe = createSubscribe<In>(port);
                const close = createCloseChannel(channelRoute, dispatch);
                const dispose = onOpen({ dispatch, subscribe, close });
                const unsubscribe = subscribe((envelope) => envelope.type === CHANNEL_CLOSE_TYPE && close(), true);

                mapDisposes.set(channelRoute, [dispose ?? noop, unsubscribe]);
            }
        });

        return function closeOpenedChannels() {
            closeRequestResponse();

            for (const disposes of mapDisposes.values()) {
                disposes.forEach(call);
            }

            mapDisposes.clear();
        };
    };
}
