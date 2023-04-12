import type { ExtractEnvelopeIn, ExtractEnvelopeOut } from '../types';
import { EnvelopeTransmitter } from '../types';
import type { SupportChanelContext } from './types';
import { createResponseFactory } from '../response';
import { noop, waitMessagePort } from '../utils';
import { createEnvelope } from '../envelope';
import { CHANNEL_CLOSE_TYPE, CHANNEL_OPEN_TYPE, ChannelCloseReason } from './defs';
import { createDispatch } from '../dispatch';
import { createSubscribe } from '../subscribe';
import { subscribeOnThreadTerminate } from '../locks';

export function supportChannelFactory<T extends EnvelopeTransmitter>(transmitter: T) {
    const dispatch = createDispatch(transmitter);
    const createResponse = createResponseFactory(dispatch);

    return function supportChannel<In extends ExtractEnvelopeIn<T>, Out extends ExtractEnvelopeOut<T>>(
        target: ExtractEnvelopeIn<T>,
        onOpen: (context: SupportChanelContext<In, Out>) => void | ((reason: ChannelCloseReason) => void),
    ) {
        const disposes: Array<Function> = [];
        const close = (reason: ChannelCloseReason) => disposes.forEach((dispose) => dispose(reason));

        const channel = new MessageChannel();
        const localPort = channel.port1;
        const remotePort = channel.port2;

        localPort.start();

        const dispatchToChannel = createDispatch(localPort);
        const subscribeToChannel = createSubscribe<In>(localPort);
        const unsubscribeOnCloseChannel = subscribeToChannel(
            (envelope) => envelope.type === CHANNEL_CLOSE_TYPE && close(ChannelCloseReason.Manual),
            true,
        );
        const unsubscribeOnThreadTerminate = subscribeOnThreadTerminate(target.threadId, () =>
            close(ChannelCloseReason.LoseChannel),
        );

        disposes.push(unsubscribeOnThreadTerminate, unsubscribeOnCloseChannel);

        createResponse<Out>(target)(createEnvelope(CHANNEL_OPEN_TYPE, remotePort, [remotePort]));

        const abortController = new AbortController();
        const onConnect = waitMessagePort(localPort, abortController.signal)
            .then(() => {
                const dispose = onOpen({ dispatch: dispatchToChannel, subscribe: subscribeToChannel });
                typeof dispose === 'function' && disposes.push(dispose);
            })
            .finally(() => {
                disposes.push(
                    () => dispatch(createEnvelope(CHANNEL_CLOSE_TYPE, undefined)),
                    () => localPort.close(),
                );
            });

        return () => {
            abortController.abort();
            onConnect.finally(() => close(ChannelCloseReason.Manual)).catch(noop);
        };
    };
}
