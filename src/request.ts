import type {
    AnyEnvelope,
    EnvelopeTransmitter,
    ExtractEnvelopeIn,
    ExtractEnvelopeOut,
    SubscribeCallback,
} from './types';
import { shallowCopyEnvelope } from './envelope';
import { createSubscribe } from './subscribe';
import { createDispatch } from './dispatch';

function createRequestName(type: string) {
    return `Request(${type}[${Date.now()}])`;
}

export function createRequest<T extends EnvelopeTransmitter>(transmitter: T) {
    const dispatch = createDispatch(transmitter);
    const subscribe = createSubscribe(transmitter);

    return function request<In extends ExtractEnvelopeIn<T>, Out extends ExtractEnvelopeOut<T>>(
        envelope: Out,
        callback: SubscribeCallback<In>,
    ) {
        const name = createRequestName(envelope.type);
        const copy = shallowCopyEnvelope(envelope);
        const isResponse = (envelope: AnyEnvelope): envelope is In => {
            return envelope.routeAnnounced === undefined ? false : envelope.routeAnnounced.startsWith(name);
        };
        const subscriber = (envelope: AnyEnvelope) => {
            if (isResponse(envelope)) callback(envelope);
        };
        const unsubscribe = subscribe(subscriber, true);

        copy.routePassed = name;
        dispatch(copy);

        return unsubscribe;
    };
}
