import type {TActorContext, TAnyEnvelope, TSubscriber} from "./types";
import {shallowCopyEnvelope} from "./envelope";

function createRequestName(type: string) {
    return `Request(${type}[${Date.now()}])`;
}

export function requestFactory<Out extends TAnyEnvelope, In extends TAnyEnvelope>(context: TActorContext<In, Out>) {
    return function request(envelope: Out, callback: TSubscriber<In>) {
        const name = createRequestName(envelope.type);
        const copy = shallowCopyEnvelope(envelope);
        const isResponse = (envelope: TAnyEnvelope): boolean => {
            return envelope.routeAnnounced === undefined ? false : envelope.routeAnnounced.startsWith(name);
        }
        const subscriber = (envelope: In) => {
            if (isResponse(envelope)) callback(envelope);
        }

        copy.routePassed = name;
        context.subscribe(subscriber);
        context.dispatch(copy);

        return () => context.unsubscribe(subscriber);
    }
}