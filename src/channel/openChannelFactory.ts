import { EnvelopeTransmitter, ExtractEnvelopeIn, ExtractEnvelopeOut, ValueOf } from '../types';
import { createRequest } from '../request';
import { CHANNEL_CLOSE_TYPE, CHANNEL_OPEN_TYPE, ChannelCloseReason, ChannelOpenEnvelope } from './defs';
import { noop } from '../utils';
import { ChannelDispose, OpenChanelContext } from './types';
import { createSubscribe } from '../subscribe';
import { createEnvelope } from '../envelope';
import { subscribeOnThreadTerminate } from '../locks';
import { createDispatch } from '../dispatch';

export function openChannelFactory<T extends EnvelopeTransmitter>(transmitter: T) {
    const request = createRequest(transmitter);

    return function openChannel<In extends ExtractEnvelopeIn<T>, Out extends ExtractEnvelopeOut<T>>(
        envelope: ExtractEnvelopeOut<T>,
        onOpen: (context: OpenChanelContext<In, Out>) => void | ChannelDispose,
    ) {
        const mapDisposes = new Map<MessagePort, Function[]>();

        const createCloseChannel = (port: MessagePort) => (reason: ValueOf<typeof ChannelCloseReason>) => {
            mapDisposes.get(port)?.forEach((dispose) => dispose(reason));
            mapDisposes.delete(port);
        };

        const closeRequestResponse = request(envelope, (envelope) => {
            if (envelope.type !== CHANNEL_OPEN_TYPE) return;

            const port = (envelope as ChannelOpenEnvelope).payload;

            if (mapDisposes.has(port)) return;

            const closeChannel = createCloseChannel(port);
            const dispatchToChannel = createDispatch(port);
            const subscribeToChannel = createSubscribe<In>(port);
            const unsubscribeOnCloseChannel = subscribeToChannel(
                (envelope) => envelope.type === CHANNEL_CLOSE_TYPE && closeChannel(ChannelCloseReason.Manual),
                true,
            );
            const unsubscribeOnThreadTerminate = subscribeOnThreadTerminate(envelope.threadId, () =>
                closeChannel(ChannelCloseReason.LoseChannel),
            );
            const dispose = onOpen({
                dispatch: dispatchToChannel,
                subscribe: subscribeToChannel,
                close: () => closeChannel(ChannelCloseReason.Manual),
            });

            mapDisposes.set(port, [
                unsubscribeOnCloseChannel,
                unsubscribeOnThreadTerminate,
                dispose ?? noop,
                () => dispatchToChannel(createEnvelope(CHANNEL_CLOSE_TYPE, undefined)),
                () => port.close(),
            ]);

            // checkAsReady(port);
        });

        return function closeOpenedChannels() {
            closeRequestResponse();

            for (const disposes of mapDisposes.values()) {
                disposes.forEach((dispose) => dispose(ChannelCloseReason.Destroy));
            }

            mapDisposes.clear();
        };
    };
}
