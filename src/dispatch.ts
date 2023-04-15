import type { EnvelopeDispatchTarget, ExtractEnvelope } from './types';
import { SystemEnvelope } from './types';

export function createDispatch<T extends EnvelopeDispatchTarget>(target: T) {
    if (target instanceof MessagePort) {
        return function dispatch<E extends ExtractEnvelope<T>>(envelope: E | SystemEnvelope) {
            target.postMessage(envelope, envelope.transferable as any);
        };
    }

    if (typeof target === 'object' && 'dispatch' in target) {
        return function dispatch<E extends ExtractEnvelope<T>>(envelope: E | SystemEnvelope) {
            target.dispatch(envelope);
        };
    }

    throw new Error('Invalid dispatch target');
}

export function dispatch<T extends EnvelopeDispatchTarget, E extends ExtractEnvelope<T>>(target: T, envelope: E) {
    createDispatch(target)(envelope);
}
