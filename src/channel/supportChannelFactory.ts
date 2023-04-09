import type { ExtractEnvelopeIn, ExtractEnvelopeOut } from '../types';
import { EnvelopeTransmitter } from '../types';
import type { SupportChanelContext } from './types';
import { createResponseFactory } from '../response';
import { getShortRandomString } from '../utils';
import { createEnvelope } from '../envelope';
import { CHANNEL_CLOSE_TYPE, CHANNEL_OPEN_TYPE } from './defs';
import { createDispatch } from '../dispatch';
import { createSubscribe } from '../subscribe';

function createChannelName() {
    return `Channel(${getShortRandomString()})`;
}

export function supportChannelFactory<T extends EnvelopeTransmitter>(transmitter: T) {
    const dispatch = createDispatch(transmitter);
    const createResponse = createResponseFactory(dispatch);

    return function supportChannel<In extends ExtractEnvelopeIn<T>, Out extends ExtractEnvelopeOut<T>>(
        target: ExtractEnvelopeIn<T>,
        onOpen: (context: SupportChanelContext<In, Out>) => void | Function,
    ) {
        const channel = new MessageChannel();
        const localPort = channel.port1;
        const remotePort = channel.port2;

        localPort.start();

        const name = createChannelName();
        const dispatchToChannel = createDispatch(localPort);
        const subscribeToChannel = createSubscribe<In>(localPort);

        createResponse<Out>(target, name)(createEnvelope(CHANNEL_OPEN_TYPE, remotePort, [remotePort]));

        const close = () => {
            dispose?.();
            unsubscribeOnClose();
            dispatchToChannel(createEnvelope(CHANNEL_CLOSE_TYPE, undefined));
        };
        const dispose = onOpen({ dispatch: dispatchToChannel, subscribe: subscribeToChannel });
        const unsubscribeOnClose = subscribeToChannel(
            (envelope) => envelope.type === CHANNEL_CLOSE_TYPE && close(),
            true,
        );

        return close;
    };
}
