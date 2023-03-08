import type { TActorContext, TAnyEnvelope, TSubscribeCallback } from './types';
import { shallowCopyEnvelope } from './envelope';

function createRequestName(type: string) {
    return `Request(${type}[${Date.now()}])`;
}

export function createRequest<_Out extends TAnyEnvelope, _In extends TAnyEnvelope>(context: TActorContext<_In, _Out>) {
    return function request<Out extends _Out, In extends _In>(envelope: Out, callback: TSubscribeCallback<In>) {
        const name = createRequestName(envelope.type);
        const copy = shallowCopyEnvelope(envelope);
        const isResponse = (envelope: TAnyEnvelope): envelope is In => {
            return envelope.routeAnnounced === undefined ? false : envelope.routeAnnounced.startsWith(name);
        };
        const subscriber = (envelope: TAnyEnvelope) => {
            if (isResponse(envelope)) callback(envelope);
        };
        const unsubscribe = context.subscribe(subscriber, true);

        copy.routePassed = name;
        context.dispatch(copy);

        return unsubscribe;
    };
}
