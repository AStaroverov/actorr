import type { AnyEnvelope, Dispatch } from './types';
import { getFirstRoutePart } from './route';
import { SystemEnvelope } from './types';

export function getDefaultResponseName(request: AnyEnvelope): string {
    return getFirstRoutePart(request.routePassed!).replace('Request', 'Response');
}

export function createResponseFactory<_T extends AnyEnvelope>(dispatch: Dispatch<_T>) {
    return function createResponse<T extends _T>(requester: AnyEnvelope, name = getDefaultResponseName(requester)) {
        const routeAnnounced = requester.routePassed;

        return function response(envelope: T | SystemEnvelope) {
            envelope.routePassed = name;
            envelope.routeAnnounced = routeAnnounced;

            return dispatch(envelope);
        };
    };
}
