import type { TAnyEnvelope, TDispatch } from './types';
import { getFirstRoutePart } from './route';
import { TSystemEnvelope } from './types';

export function getDefaultResponseName(request: TAnyEnvelope): string {
    return getFirstRoutePart(request.routePassed!).replace('Request', 'Response');
}

export function createResponseFactory<_T extends TAnyEnvelope>(dispatch: TDispatch<_T>) {
    return function createResponse<T extends _T>(requester: TAnyEnvelope, name = getDefaultResponseName(requester)) {
        const routeAnnounced = requester.routePassed;

        return function response(envelope: T | TSystemEnvelope) {
            envelope.routePassed = name;
            envelope.routeAnnounced = routeAnnounced;

            return dispatch(envelope);
        };
    };
}
