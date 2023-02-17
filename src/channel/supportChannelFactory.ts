import {TActorContext, TAnyEnvelope, TDispatcher, TSubscribeCallback, TSubscriber} from "../types";
import {createResponseFactory} from "../response";
import {getShortRandomString, once} from "../utils";
import {createEnvelope} from "../envelope";
import {CHANNEL_CLOSE_TYPE, CHANNEL_OPEN_TYPE} from "./defs";
import {isSystemEnvelope} from "../utils/isSystemEnvelope";
import {createSubscribe} from "../utils/subscribe";

type TFilter<T extends TAnyEnvelope> = (envelope: TAnyEnvelope) => envelope is T;

function createChannelName() {
    return `Channel(${getShortRandomString()})`;
}

function createIsChannelEnvelop<T extends TAnyEnvelope>(name: string) {
    return function isChannelEnvelop(envelope: TAnyEnvelope): envelope is T {
        return envelope.routePassed === undefined ? false : envelope.routePassed.startsWith(name);
    }
}

export function supportChannelFactory<_In extends TAnyEnvelope, _Out extends TAnyEnvelope>(
    context: TActorContext<_In, _Out>,
) {
    const mapClose = new Map<string, Function>();
    const mapDispose = new Map<string, Function>();
    const mapUnsubscribe = new Map<string, Function>();

    const subscribeToContext = createSubscribe(context);
    const createResponse = createResponseFactory<_Out>(context.dispatch);

    const createCloseChannel = <T extends TAnyEnvelope>(dispatch: TDispatcher<T>,  name: string) => once(() => {
        mapDispose.has(name) && mapDispose.get(name)!();
        mapUnsubscribe.has(name) && mapUnsubscribe.get(name)!();

        mapClose.delete(name);
        mapDispose.delete(name);
        mapUnsubscribe.delete(name);

        dispatch(createEnvelope(CHANNEL_CLOSE_TYPE, undefined));
    });

    const createSubscribeToChannel = <T extends TAnyEnvelope>(filter: TFilter<T>) =>
        (callback: TSubscribeCallback<T>) =>
            subscribeToContext((envelope) => {
                if (filter(envelope) && !isSystemEnvelope(envelope)) {
                    callback(envelope);
                }
            });

    const subscribeToChannelClose = <T extends TAnyEnvelope>(filter: TFilter<T>, name: string) =>
        subscribeToContext((envelope) => {
            if (filter(envelope) && envelope.type === CHANNEL_CLOSE_TYPE) {
                mapClose.has(name) && mapClose.get(name)!();
            }
        })

    return function supportChannel<In extends _In, Out extends _Out>
    (target: _In, onOpen: (dispatch: TDispatcher<Out>, subscriber: TSubscriber<In>) => void | Function) {
        const name = createChannelName();
        const isChannelEnvelope = createIsChannelEnvelop<In>(name);
        const dispatchToChannel = createResponse<Out>(target, name);
        const subscribeToChannel = createSubscribeToChannel(isChannelEnvelope);
        const unsubscribeCloseCatcher = subscribeToChannelClose(isChannelEnvelope, name);

        dispatchToChannel(createEnvelope(CHANNEL_OPEN_TYPE, undefined));

        const close = createCloseChannel(dispatchToChannel, name);
        const dispose = onOpen(dispatchToChannel, subscribeToChannel);

        mapClose.set(name, close);
        mapUnsubscribe.set(name, unsubscribeCloseCatcher);
        if (typeof dispose === 'function') mapDispose.set(name, dispose);

        return close;
    }
}
