import type {TAnyEnvelope, TDispatcher} from "./types";
import {getFirstRoutePart} from "./utils/route";

export function getDefaultResponseName(request: TAnyEnvelope): string {
    return getFirstRoutePart(request.routePassed!).replace('Request', 'Response');
}

export function createResponseFactory<T extends TAnyEnvelope>(dispatch: TDispatcher<T>) {
    return function createResponse(requester: TAnyEnvelope, name = getDefaultResponseName(requester)) {
        const routeAnnounced = requester.routePassed;

        return function response(envelope: T) {
            envelope.routePassed = name;
            envelope.routeAnnounced = routeAnnounced;

            return dispatch(envelope);
        }
    }
}