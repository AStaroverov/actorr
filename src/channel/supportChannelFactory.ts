import type { TActorContext, TAnyEnvelope, TDispatch, TSubscribe } from '../types';
import type { TSupportChanelContext } from './types';
import { createResponseFactory } from '../response';
import { getShortRandomString, once } from '../utils';
import { createEnvelope } from '../envelope';
import { CHANNEL_CLOSE_TYPE, CHANNEL_OPEN_TYPE } from './defs';

type TFilter<T extends TAnyEnvelope> = (envelope: TAnyEnvelope) => envelope is T;

function createChannelName() {
    return `Channel(${getShortRandomString()})`;
}

function createIsChannelEnvelop<T extends TAnyEnvelope>(name: string) {
    return function isChannelEnvelop(envelope: TAnyEnvelope): envelope is T {
        return envelope.routePassed === undefined ? false : envelope.routePassed.startsWith(name);
    };
}

export function supportChannelFactory<_In extends TAnyEnvelope, _Out extends TAnyEnvelope>(
    context: TActorContext<_In, _Out>,
) {
    const mapClose = new Map<string, Function>();
    const mapDispose = new Map<string, Function>();
    const mapUnsubscribe = new Map<string, Function>();

    const createResponse = createResponseFactory<_Out>(context.dispatch);

    const createCloseChannel = <T extends TAnyEnvelope>(dispatch: TDispatch<T>, name: string) =>
        once(() => {
            mapDispose.has(name) && mapDispose.get(name)!();
            mapUnsubscribe.has(name) && mapUnsubscribe.get(name)!();

            mapClose.delete(name);
            mapDispose.delete(name);
            mapUnsubscribe.delete(name);

            dispatch(createEnvelope(CHANNEL_CLOSE_TYPE, undefined));
        });

    const createSubscribeToChannel =
        <T extends TAnyEnvelope>(filter: TFilter<T>): TSubscribe<T> =>
        (callback, withSystemEnvelopes) =>
            context.subscribe((envelope) => filter(envelope) && callback(envelope), withSystemEnvelopes);

    const subscribeToChannelClose = <T extends TAnyEnvelope>(filter: TFilter<T>, name: string) =>
        context.subscribe((envelope) => {
            if (filter(envelope) && envelope.type === CHANNEL_CLOSE_TYPE) {
                mapClose.has(name) && mapClose.get(name)!();
            }
        }, true);

    return function supportChannel<In extends _In, Out extends _Out>(
        target: _In,
        onOpen: (context: TSupportChanelContext<In, Out>) => void | Function,
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
