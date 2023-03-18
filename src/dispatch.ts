import type { AnyEnvelope, Envelope, EnvelopeDispatchTarget, ExtractEnvelope } from './types';
import { getMessagePort } from './worker/ports';
import { Dispatch, ExtractEnvelopeIn, SystemEnvelope } from './types';

export function createDispatch<T extends EnvelopeDispatchTarget>(target: T) {
    return function dispatch<E extends ExtractEnvelope<T>>(envelope: E | SystemEnvelope) {
        if (typeof target === 'string') {
            queueMicrotask(() => {
                const port = getMessagePort(target);
                if (port !== undefined) {
                    port.postMessage(envelope, envelope.transferable as any);
                }
            });
        } else if (typeof target === 'object' && 'postMessage' in target) {
            target.postMessage(envelope, envelope.transferable as any);
        } else if (typeof target === 'object' && 'dispatch' in target) {
            target.dispatch(envelope);
        }
    };
}

export function dispatch<T extends EnvelopeDispatchTarget, E extends ExtractEnvelope<T>>(target: T, envelope: E) {
    createDispatch(target)(envelope);
}
