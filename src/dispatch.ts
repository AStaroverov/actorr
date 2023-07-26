import type { EnvelopeDispatchTarget, ExtractEnvelope } from './types';
import { AnyEnvelope } from './types';
import { loggerProvider } from './providers';
import { onPortResolve } from './utils/MessagePort';

function createDispatchWithQueue(port: MessagePort) {
    return function dispatchWithQueue(envelope: AnyEnvelope) {
        onPortResolve(port, (state) => {
            if (!state) return;
            try {
                port.postMessage(envelope, envelope.transferable as any);
            } catch (err) {
                loggerProvider.error(err);
            }
        });
    };
}

export function createDispatch<T extends EnvelopeDispatchTarget>(target: T) {
    if (typeof target === 'object' && 'postMessage' in target) {
        return createDispatchWithQueue(target);
    }

    if (typeof target === 'object' && 'dispatch' in target) {
        return target.dispatch.bind(target);
    }

    throw new Error('Invalid dispatch target');
}

export function dispatch<T extends EnvelopeDispatchTarget, E extends ExtractEnvelope<T>>(target: T, envelope: E) {
    createDispatch(target)(envelope);
}
