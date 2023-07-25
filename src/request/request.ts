import type {
    AnyEnvelope,
    EnvelopeTransmitter,
    ExtractEnvelopeIn,
    ExtractEnvelopeOut,
    SubscribeCallback,
} from '../types';
import { shallowCopyEnvelope } from '../envelope';
import { createSubscribe } from '../subscribe';
import { createDispatch } from '../dispatch';
import { createShortRandomString } from '../utils/common';

export function createRequestName(type: string) {
    return `Request(${type}[${createShortRandomString()}])`;
}

export function createRequest<T extends EnvelopeTransmitter>(transmitter: T) {
    const dispatch = createDispatch(transmitter);
    const subscribe = createSubscribe(transmitter);

    return function request<In extends ExtractEnvelopeIn<T>, Out extends ExtractEnvelopeOut<T>>(
        envelope: Out,
        callback: SubscribeCallback<In>,
    ) {
        const copy = shallowCopyEnvelope(envelope);
        const seedRoute = envelope.routePassed ?? createRequestName(envelope.type);
        const isResponse = (envelope: AnyEnvelope): envelope is In => {
            return envelope.routeAnnounced === undefined ? false : envelope.routeAnnounced.startsWith(seedRoute);
        };
        const subscriber = (envelope: AnyEnvelope) => {
            if (isResponse(envelope)) callback(envelope);
        };
        const unsubscribe = subscribe(subscriber, true);

        copy.routePassed = seedRoute;
        dispatch(copy);

        return unsubscribe;
    };
}
