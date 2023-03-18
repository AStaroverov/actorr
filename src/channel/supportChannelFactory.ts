import type { ActorContext, AnyEnvelope, Dispatch, ExtractEnvelopeIn, ExtractEnvelopeOut, Subscribe } from '../types';
import type { SupportChanelContext } from './types';
import { createResponseFactory } from '../response';
import { getShortRandomString, once } from '../utils';
import { createEnvelope } from '../envelope';
import { CHANNEL_CLOSE_TYPE, CHANNEL_OPEN_TYPE } from './defs';
import { EnvelopeTransmitter } from '../types';
import { createDispatch } from '../dispatch';
import { createSubscribe } from '../subscribe';

type Filter<T extends AnyEnvelope> = (envelope: AnyEnvelope) => envelope is T;

function createChannelName() {
    return `Channel(${getShortRandomString()})`;
}

function createIsChannelEnvelop<T extends AnyEnvelope>(name: string) {
    return function isChannelEnvelop(envelope: AnyEnvelope): envelope is T {
        return envelope.routePassed === undefined ? false : envelope.routePassed.startsWith(name);
    };
}

export function supportChannelFactory<T extends EnvelopeTransmitter>(transmitter: T) {
    const mapClose = new Map<string, Function>();
    const mapDispose = new Map<string, Function>();
    const mapUnsubscribe = new Map<string, Function>();

    const dispatch = createDispatch(transmitter);
    const subscribe = createSubscribe(transmitter);
    const createResponse = createResponseFactory(dispatch);

    const createCloseChannel = <T extends AnyEnvelope>(dispatch: Dispatch<T>, name: string) =>
        once(() => {
            mapDispose.has(name) && mapDispose.get(name)!();
            mapUnsubscribe.has(name) && mapUnsubscribe.get(name)!();

            mapClose.delete(name);
            mapDispose.delete(name);
            mapUnsubscribe.delete(name);

            dispatch(createEnvelope(CHANNEL_CLOSE_TYPE, undefined));
        });

    const createSubscribeToChannel =
        <T extends AnyEnvelope>(filter: Filter<T>): Subscribe<T> =>
        (callback, withSystemEnvelopes) =>
            subscribe((envelope) => filter(envelope) && callback(envelope), withSystemEnvelopes);

    const subscribeToChannelClose = <T extends AnyEnvelope>(filter: Filter<T>, name: string) =>
        subscribe((envelope) => {
            if (filter(envelope) && envelope.type === CHANNEL_CLOSE_TYPE) {
                mapClose.has(name) && mapClose.get(name)!();
            }
        }, true);

    return function supportChannel<In extends ExtractEnvelopeIn<T>, Out extends ExtractEnvelopeOut<T>>(
        target: ExtractEnvelopeIn<T>,
        onOpen: (context: SupportChanelContext<In, Out>) => void | Function,
    ) {
        const name = createChannelName();
        const isChannelEnvelope = createIsChannelEnvelop<In>(name);
        const dispatchToChannel = createResponse<Out>(target, name);
        const subscribeToChannel = createSubscribeToChannel(isChannelEnvelope);
        const unsubscribeCloseCatcher = subscribeToChannelClose(isChannelEnvelope, name);

        dispatchToChannel(createEnvelope(CHANNEL_OPEN_TYPE, undefined));

        const close = createCloseChannel(dispatchToChannel, name);
        const dispose = onOpen({ dispatch: dispatchToChannel, subscribe: subscribeToChannel });

        mapClose.set(name, close);
        mapUnsubscribe.set(name, unsubscribeCloseCatcher);
        typeof dispose === 'function' && mapDispose.set(name, dispose);

        return close;
    };
}
