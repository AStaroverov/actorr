import type { ExtractEnvelopeIn, ExtractEnvelopeOut, ValueOf } from '../types';
import { EnvelopeTransmitter } from '../types';
import type { ChannelDispose, SupportChanelContext } from './types';
import { createResponseFactory } from '../response';
import { createMessagePortName, noop, setPortName } from '../utils';
import { createEnvelope } from '../envelope';
import { CHANNEL_CLOSE_TYPE, CHANNEL_OPEN_TYPE, ChannelCloseReason } from './defs';
import { createDispatch } from '../dispatch';
import { createSubscribe } from '../subscribe';
import { subscribeOnThreadTerminate } from '../locks';

export function supportChannelFactory<T extends EnvelopeTransmitter>(transmitter: T) {
    const createResponse = createResponseFactory(createDispatch(transmitter));

    return function supportChannel<In extends ExtractEnvelopeIn<T>, Out extends ExtractEnvelopeOut<T>>(
        target: ExtractEnvelopeIn<T>,
        onOpen: (context: SupportChanelContext<In, Out>) => void | ChannelDispose,
    ) {
        const channel = new MessageChannel();
        const localPort = channel.port1;
        const remotePort = channel.port2;

        setPortName(localPort, createMessagePortName(target.routePassed));

        createResponse<Out>(target)(createEnvelope(CHANNEL_OPEN_TYPE, remotePort, [remotePort]));

        const disposes: Array<Function | ChannelDispose> = [];
        const closeChannel = (reason: ValueOf<typeof ChannelCloseReason>) =>
            disposes.forEach((dispose) => dispose(reason));
        const dispatchToChannel = createDispatch(localPort);
        const subscribeToChannel = createSubscribe<In>(localPort);
        const unsubscribeOnCloseChannel = subscribeToChannel(
            (envelope) => envelope.type === CHANNEL_CLOSE_TYPE && closeChannel(ChannelCloseReason.Manual),
            true,
        );
        const unsubscribeOnThreadTerminate = subscribeOnThreadTerminate(target.threadId, () =>
            closeChannel(ChannelCloseReason.LoseChannel),
        );
        const dispose = onOpen({ dispatch: dispatchToChannel, subscribe: subscribeToChannel });

        disposes.push(
            unsubscribeOnThreadTerminate,
            unsubscribeOnCloseChannel,
            dispose ?? noop,
            () => dispatchToChannel(createEnvelope(CHANNEL_CLOSE_TYPE, undefined)),
            () => setTimeout(() => localPort.close()),
        );

        return () => closeChannel(ChannelCloseReason.Manual);
    };
}
