import type { ExtractEnvelopeIn, ExtractEnvelopeOut, UnknownEnvelope, ValueOf } from '../types';
import { EnvelopeTransmitter } from '../types';
import type { ChannelDispose, SupportChanelContext } from './types';
import { createResponseFactory } from '../request/response';
import { createMessagePortName, setPortName } from '../utils';
import { createEnvelope } from '../envelope';
import { CHANNEL_CLOSE_TYPE, CHANNEL_HANDSHAKE_TYPE, ChannelCloseEnvelope, ChannelCloseReason } from './defs';
import { createDispatch } from '../dispatch';
import { createSubscribe } from '../subscribe';
import { subscribeOnThreadTerminate } from '../locks';
import { timeoutProvider } from '../providers';

export function supportChannelFactory<T extends EnvelopeTransmitter>(transmitter: T) {
    const createResponse = createResponseFactory(createDispatch(transmitter));
    const subscribeToTransmitter = createSubscribe(transmitter);

    return function supportChannel<In extends ExtractEnvelopeIn<T>, Out extends ExtractEnvelopeOut<T>>(
        target: ExtractEnvelopeIn<T>,
        onOpen: (context: SupportChanelContext<In, Out>) => void | ChannelDispose,
    ) {
        if (target.routePassed === undefined) throw new Error('This envelope cannot be used to support a channel');

        const channel = new MessageChannel();
        const localPort = channel.port1;
        const remotePort = channel.port2;

        setPortName(localPort, createMessagePortName(target.routePassed));

        createResponse<Out>(target)(createEnvelope(CHANNEL_HANDSHAKE_TYPE, remotePort, [remotePort]));

        let closeChannel: ChannelDispose;
        const dispatchToChannel = createDispatch(localPort);
        const subscribeToChannel = createSubscribe<In>(localPort);
        const unsubscribeOnFastClose = subscribeToTransmitter((envelope: UnknownEnvelope | ChannelCloseEnvelope) => {
            return (
                envelope.type === CHANNEL_CLOSE_TYPE &&
                envelope.routePassed === target.routePassed &&
                closeChannel(ChannelCloseReason.Manual)
            );
        }, true);
        const unsubscribeOnCloseChannel = subscribeToChannel(
            (envelope) => envelope.type === CHANNEL_CLOSE_TYPE && closeChannel(ChannelCloseReason.Manual),
            true,
        );
        const unsubscribeOnThreadTerminate = subscribeOnThreadTerminate(target.threadId, () => {
            closeChannel(ChannelCloseReason.LoseChannel);
        });
        const dispose = onOpen({ dispatch: dispatchToChannel, subscribe: subscribeToChannel });

        closeChannel = (reason: ValueOf<typeof ChannelCloseReason>) => {
            unsubscribeOnThreadTerminate();
            unsubscribeOnCloseChannel();
            unsubscribeOnFastClose();
            dispose?.(reason);
            dispatchToChannel(createEnvelope(CHANNEL_CLOSE_TYPE, undefined));
            timeoutProvider.setTimeout(() => localPort.close());
        };

        return () => {
            closeChannel(ChannelCloseReason.Manual);
        };
    };
}
