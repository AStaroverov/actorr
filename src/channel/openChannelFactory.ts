import { EnvelopeTransmitter, ExtractEnvelopeIn, ExtractEnvelopeOut, ValueOf } from '../types';
import { createRequest, createRequestName } from '../request/request';
import { CHANNEL_CLOSE_TYPE, CHANNEL_HANDSHAKE_TYPE, ChannelCloseReason, ChannelHandshakeEnvelope } from './defs';
import { createMessagePortName, setPortName } from '../utils';
import { ChannelDispose, OpenChanelContext } from './types';
import { createSubscribe } from '../subscribe';
import { createEnvelope, shallowCopyEnvelope } from '../envelope';
import { subscribeOnThreadTerminate } from '../locks';
import { createDispatch } from '../dispatch';
import { timeoutProvider } from '../providers';

export function openChannelFactory<T extends EnvelopeTransmitter>(transmitter: T) {
    const request = createRequest(transmitter);
    const dispatch = createDispatch(transmitter);

    return function openChannel<In extends ExtractEnvelopeIn<T>, Out extends ExtractEnvelopeOut<T>>(
        envelope: ExtractEnvelopeOut<T>,
        onOpen: (context: OpenChanelContext<In, Out>) => void | ChannelDispose,
    ) {
        const mapDispose = new Map<MessagePort, Function>();

        const openEnvelope = shallowCopyEnvelope(envelope);
        const closeEnvelope = createEnvelope(CHANNEL_CLOSE_TYPE, undefined);
        closeEnvelope.routePassed = openEnvelope.routePassed = createRequestName(envelope.type);

        const createCloseChannel = (port: MessagePort) => (reason: ValueOf<typeof ChannelCloseReason>) => {
            mapDispose.get(port)?.(reason);
            mapDispose.delete(port);
        };

        const closeRequestResponse = request(openEnvelope, (envelope) => {
            if (envelope.type !== CHANNEL_HANDSHAKE_TYPE) return;

            const port = (envelope as ChannelHandshakeEnvelope).payload;

            setPortName(port, createMessagePortName(envelope.routePassed));

            if (mapDispose.has(port)) return;

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

            mapDispose.set(port, (reason: ValueOf<typeof ChannelCloseReason>) => {
                unsubscribeOnCloseChannel();
                unsubscribeOnThreadTerminate();
                dispose?.(reason);
                dispatchToChannel(closeEnvelope);
                timeoutProvider.setTimeout(() => port.close());
            });
        });

        return function closeOpenedChannels() {
            closeRequestResponse();

            for (const dispose of mapDispose.values()) {
                dispose(ChannelCloseReason.Destroy);
            }

            mapDispose.clear();

            // Necessary only for web workers case
            dispatch(closeEnvelope);
        };
    };
}
