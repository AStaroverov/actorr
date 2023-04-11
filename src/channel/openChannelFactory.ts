import { EnvelopeTransmitter, ExtractEnvelopeIn, ExtractEnvelopeOut } from '../types';
import { createRequest } from '../request';
import { CHANNEL_CLOSE_TYPE, CHANNEL_OPEN_TYPE, ChannelOpenEnvelope, EChannelCloseReason } from './defs';
import { noop } from '../utils';
import { OpenChanelContext } from './types';
import { createDispatch } from '../dispatch';
import { createSubscribe } from '../subscribe';
import { createEnvelope } from '../envelope';
import { PONG } from '../defs';
import { subscribeOnThreadTerminate } from '../locks';

export function openChannelFactory<T extends EnvelopeTransmitter>(transmitter: T) {
    const request = createRequest(transmitter);

    return function openChannel<In extends ExtractEnvelopeIn<T>, Out extends ExtractEnvelopeOut<T>>(
        envelope: ExtractEnvelopeOut<T>,
        onOpen: (context: OpenChanelContext<In, Out>) => void | ((reason: EChannelCloseReason) => void),
    ) {
        const mapDisposes = new Map<string, Function[]>();

        const createCloseChannel = (routeName: string) => (reason: EChannelCloseReason) => {
            mapDisposes.has(routeName) && mapDisposes.get(routeName)!.forEach((dispose) => dispose(reason));
            mapDisposes.delete(routeName);
        };

        const closeRequestResponse = request(envelope, (envelope) => {
            const channelRoute = envelope.routePassed;

            if (channelRoute === undefined) {
                return;
            }

            if (envelope.type === CHANNEL_OPEN_TYPE && !mapDisposes.has(channelRoute)) {
                const port = (envelope as ChannelOpenEnvelope).payload;

                port.start();
                port.postMessage(PONG);

                const close = createCloseChannel(channelRoute);
                const dispatch = createDispatch(port);
                const subscribe = createSubscribe<In>(port);
                const unsubscribeOnCloseChannel = subscribe(
                    (envelope) => envelope.type === CHANNEL_CLOSE_TYPE && close(EChannelCloseReason.Manual),
                    true,
                );
                const unsubscribeOnThreadTerminate = subscribeOnThreadTerminate(envelope.threadId, () =>
                    close(EChannelCloseReason.LoseChannel),
                );
                const dispose = onOpen({ dispatch, subscribe, close: () => close(EChannelCloseReason.Manual) });

                mapDisposes.set(channelRoute, [
                    unsubscribeOnCloseChannel,
                    unsubscribeOnThreadTerminate,
                    dispose ?? noop,
                    () => dispatch(createEnvelope(CHANNEL_CLOSE_TYPE, undefined)),
                    () => port.close(),
                ]);
            }
        });

        return function closeOpenedChannels() {
            closeRequestResponse();

            for (const disposes of mapDisposes.values()) {
                disposes.forEach((dispose) => dispose(EChannelCloseReason.Destroy));
            }

            mapDisposes.clear();
        };
    };
}
