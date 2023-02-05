import type {TAnyEnvelope} from "./types";
import {shallowCopyEnvelope} from "./envelope";

function createRequestName(type: string) {
    return `Request(${type}[${Date.now()}])`;
}

export function createRequest<T extends TAnyEnvelope>(dispatch: (envelope: T) => void) {
    return function request(envelope: T) {
        const name = createRequestName(envelope.type);
        const copy = shallowCopyEnvelope(envelope);

        copy.routePassed = name;

        dispatch(copy);

        return function isResponse(envelope: TAnyEnvelope): boolean {
            return envelope.routeAnnounced === undefined ? false : envelope.routeAnnounced.startsWith(name);
        };
    }
}