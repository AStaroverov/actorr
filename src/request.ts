import type {TActorContext, TAnyEnvelope, TSubscriber} from "./types";
import {shallowCopyEnvelope} from "./envelope";

function createRequestName(type: string) {
    return `Request(${type}[${Date.now()}])`;
}

export function createRequest<Out extends TAnyEnvelope, In extends TAnyEnvelope>(context: TActorContext<In, Out>) {
    return function request(envelope: Out) {
        const name = createRequestName(envelope.type);
        const copy = shallowCopyEnvelope(envelope);
        const isResponse = (envelope: TAnyEnvelope): boolean => {
            return envelope.routeAnnounced === undefined ? false : envelope.routeAnnounced.startsWith(name);
        }
        const createSubscriber = (callback: TSubscriber<In>) => (envelope: In) => {
            if (isResponse(envelope)) callback(envelope);
        }

        copy.routePassed = name;
        context.dispatch(copy);

        return (callback: TSubscriber<In>) => {
            const subscriber = createSubscriber(callback);
            context.subscribe(subscriber);
            return () => context.unsubscribe(subscriber);
        }
    }
}