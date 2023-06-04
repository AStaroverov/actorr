import type { AnyEnvelope, Dispatch } from '../types';
import { SystemEnvelope } from '../types';
import { getFirstRoutePart } from '../route';

export function getResponseName(request: AnyEnvelope): string {
    return getFirstRoutePart(request.routePassed!).replace('Request', 'Response');
}

export function createResponseFactory<_T extends AnyEnvelope>(dispatch: Dispatch<_T>) {
    return function createResponse<T extends _T>(requester: AnyEnvelope) {
        const routePassed = getResponseName(requester);
        const routeAnnounced = requester.routePassed;

        return function response(envelope: T | SystemEnvelope) {
            envelope.routePassed = routePassed;
            envelope.routeAnnounced = routeAnnounced;

            return dispatch(envelope);
        };
    };
}
