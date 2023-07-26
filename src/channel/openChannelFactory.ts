import { EnvelopeTransmitter, ExtractEnvelopeIn, ExtractEnvelopeOut, ValueOf } from '../types';
import { createRequest } from '../request/request';
import { CHANNEL_CLOSE_TYPE, CHANNEL_HANDSHAKE_TYPE, ChannelCloseReason, ChannelHandshakeEnvelope } from './defs';
import { ChannelDispose, OpenChanelContext } from './types';
import { createSubscribe } from '../subscribe';
import { createDispatch } from '../dispatch';
import { closePort, createMessagePortName, onPortResolve, setPortName } from '../utils/MessagePort';
import { createEnvelope, shallowCopyEnvelope } from '../envelope';
import { createShortRandomString } from '../utils/common';
import { lock, subscribeOnUnlock } from '../utils/Locks';

export function openChannelFactory<T extends EnvelopeTransmitter>(transmitter: T) {
    const request = createRequest(transmitter);

    return function openChannel<In extends ExtractEnvelopeIn<T>, Out extends ExtractEnvelopeOut<T>>(
        envelope: ExtractEnvelopeOut<T>,
        onOpen: (context: OpenChanelContext<In, Out>) => void | ChannelDispose,
    ) {
        const copy = shallowCopyEnvelope(envelope);
        copy.uniqueId = createShortRandomString();

        const mapDispose = new Map<MessagePort, Function>();

        const createCloseChannel = (port: MessagePort) => (reason: ValueOf<typeof ChannelCloseReason>) => {
            mapDispose.get(port)?.(reason);
            mapDispose.delete(port);
        };
        const closeAllChannels = () => {
            for (const dispose of mapDispose.values()) {
                dispose(ChannelCloseReason.Destroy);
            }
            mapDispose.clear();
        };

        const unlockRequestSide = lock(copy.uniqueId);
        const closeResponseSubscription = request(copy, (envelope) => {
            if (envelope.type !== CHANNEL_HANDSHAKE_TYPE) return;

            const port = (envelope as ChannelHandshakeEnvelope).payload;

            setPortName(port, createMessagePortName(envelope.routePassed));

            if (mapDispose.has(port)) return;

            const closeChannel = createCloseChannel(port);
            const dispatchToChannel = createDispatch(port);
            const subscribeToChannel = createSubscribe<In>(port);

            const unsubscribeOnCloseChannel = subscribeToChannel(
                (envelope) =>
                    envelope.type === CHANNEL_CLOSE_TYPE && closeChannel(ChannelCloseReason.ManualBySupporter),
                true,
            );
            const unsubscribeOnChannelTerminate = subscribeOnUnlock(envelope.uniqueId, () =>
                closeChannel(ChannelCloseReason.LoseChannel),
            );
            const dispose = onOpen({
                dispatch: dispatchToChannel,
                subscribe: subscribeToChannel,
                close: () => closeChannel(ChannelCloseReason.ManualByOpener),
            });

            mapDispose.set(port, (reason: ValueOf<typeof ChannelCloseReason>) => {
                unsubscribeOnCloseChannel();
                unsubscribeOnChannelTerminate();
                dispose?.(reason);

                if (reason === ChannelCloseReason.ManualBySupporter || reason === ChannelCloseReason.LoseChannel) {
                    closePort(port);
                } else {
                    dispatchToChannel(createEnvelope(CHANNEL_CLOSE_TYPE, undefined));
                    onPortResolve(port, () => closePort(port));
                }
            });
        });

        return function closeOpenedChannels() {
            closeResponseSubscription();
            closeAllChannels();
            unlockRequestSide();
        };
    };
}
