import type {TActorContext, TAnyEnvelope, TSubscribeCallback} from "./types";
import {shallowCopyEnvelope} from "./envelope";

function createRequestName(type: string) {
    return `Request(${type}[${Date.now()}])`;
}

export function requestFactory<_Out extends TAnyEnvelope, _In extends TAnyEnvelope>(context: TActorContext<_In, _Out>) {
    return function request<Out extends _Out, In extends _In>(envelope: Out, callback: TSubscribeCallback<In>) {
        const name = createRequestName(envelope.type);
        const copy = shallowCopyEnvelope(envelope);
        const isResponse = (envelope: TAnyEnvelope): envelope is In => {
            return envelope.routeAnnounced === undefined ? false : envelope.routeAnnounced.startsWith(name);
        }
        const subscriber = (envelope: TAnyEnvelope) => {
            if (isResponse(envelope)) callback(envelope);
        }

        copy.routePassed = name;
        context.subscribe(subscriber);
        context.dispatch(copy);

        return () => context.unsubscribe(subscriber);
    }
}