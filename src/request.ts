import type { ActorContext, AnyEnvelope, SubscribeCallback } from './types';
import { shallowCopyEnvelope } from './envelope';

function createRequestName(type: string) {
    return `Request(${type}[${Date.now()}])`;
}

export function createRequest<_Out extends AnyEnvelope, _In extends AnyEnvelope>(context: ActorContext<_In, _Out>) {
    return function request<Out extends _Out, In extends _In>(envelope: Out, callback: SubscribeCallback<In>) {
        const name = createRequestName(envelope.type);
        const copy = shallowCopyEnvelope(envelope);
        const isResponse = (envelope: AnyEnvelope): envelope is In => {
            return envelope.routeAnnounced === undefined ? false : envelope.routeAnnounced.startsWith(name);
        };
        const subscriber = (envelope: AnyEnvelope) => {
            if (isResponse(envelope)) callback(envelope);
        };
        const unsubscribe = context.subscribe(subscriber, true);

        copy.routePassed = name;
        context.dispatch(copy);

        return unsubscribe;
    };
}
