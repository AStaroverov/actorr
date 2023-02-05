import type {TAnyEnvelope} from "./types";

export function createResponseEnvelope<T extends TAnyEnvelope>(
    envelope: T,
    source: TAnyEnvelope,
): T {
    envelope.routeAnnounced = source.routePassed;
    return envelope;
}

export function createResponse<T extends TAnyEnvelope>(dispatch: (envelope: T) => void, requester: TAnyEnvelope) {
    return (envelope: T) => dispatch(createResponseEnvelope<T>(envelope, requester))
}