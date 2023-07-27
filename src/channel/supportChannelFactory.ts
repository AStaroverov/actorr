import type { ExtractEnvelopeIn, ExtractEnvelopeOut, ValueOf } from '../types';
import { EnvelopeTransmitter } from '../types';
import type { ChannelDispose, SupportChanelContext } from './types';
import { createResponseFactory } from '../request/response';
import { createEnvelope } from '../envelope';
import { CHANNEL_CLOSE_TYPE, CHANNEL_HANDSHAKE_TYPE, ChannelCloseReason } from './defs';
import { createDispatch } from '../dispatch';
import { createSubscribe } from '../subscribe';
import { closePort, createMessagePortName, onPortResolve, setPortName } from '../utils/MessagePort';
import { noop } from '../utils/common';
import { lock, subscribeOnUnlock } from '../utils/Locks';
import { timeoutProvider } from '../providers';

export function supportChannelFactory<T extends EnvelopeTransmitter>(transmitter: T) {
    const createResponse = createResponseFactory(createDispatch(transmitter));

    return function supportChannel<In extends ExtractEnvelopeIn<T>, Out extends ExtractEnvelopeOut<T>>(
        target: ExtractEnvelopeIn<T>,
        onOpen: (context: SupportChanelContext<In, Out>) => void | ChannelDispose,
    ) {
        if (target.routePassed === undefined) throw new Error('This envelope cannot be used to support a channel');

        const channel = new MessageChannel();
        const localPort = channel.port1;
        const remotePort = channel.port2;
        const responseEnvelope = createEnvelope(CHANNEL_HANDSHAKE_TYPE, remotePort, [remotePort]);
        const unlockResponseSide = lock(responseEnvelope.uniqueId);

        setPortName(localPort, createMessagePortName(target.routePassed));

        createResponse<Out>(target)(responseEnvelope);

        let closeChannel: (reason: ValueOf<typeof ChannelCloseReason>) => void;
        const dispatchToChannel = createDispatch(localPort);
        const subscribeToChannel = createSubscribe<In>(localPort);
        const unsubscribeOnCloseChannel = subscribeToChannel(
            (envelope) => envelope.type === CHANNEL_CLOSE_TYPE && closeChannel(ChannelCloseReason.ManualByOpener),
            true,
        );
        const unsubscribeOnChannelTerminate = subscribeOnUnlock(target.uniqueId, () => {
            // close message can be in browser queue, so we need to wait a little
            timeoutProvider.setTimeout(() => closeChannel(ChannelCloseReason.LoseChannel), 1000);
        });
        const dispose = onOpen({ dispatch: dispatchToChannel, subscribe: subscribeToChannel });

        closeChannel = (reason: ValueOf<typeof ChannelCloseReason>) => {
            closeChannel = noop;

            unsubscribeOnChannelTerminate();
            unsubscribeOnCloseChannel();
            dispose?.(reason);

            if (reason === ChannelCloseReason.ManualByOpener || reason === ChannelCloseReason.LoseChannel) {
                closePort(localPort);
                unlockResponseSide();
            } else {
                dispatchToChannel(createEnvelope(CHANNEL_CLOSE_TYPE, undefined));
                onPortResolve(localPort, () => {
                    closePort(localPort);
                    unlockResponseSide();
                });
            }
        };

        return () => {
            closeChannel(ChannelCloseReason.ManualBySupporter);
        };
    };
}
