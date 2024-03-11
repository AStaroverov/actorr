import type { EnvelopeDispatchTarget, ExtractEnvelope } from './types';
import { AnyEnvelope } from './types';
import { loggerProvider } from './providers';
import { onPortResolve } from './utils/MessagePort';
import { isSystemEnvelope } from './isSystemEnvelope';

function createPortDispatch(port: MessagePort) {
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
        return createPortDispatch(target);
    }

    if (typeof target === 'object' && 'dispatch' in target) {
        return target.dispatch.bind(target);
    }

    throw new Error('Invalid dispatch target');
}

export function createDeferredDispatch<T extends EnvelopeDispatchTarget>(target: T, promise: Promise<unknown>) {
    const dispatch = createDispatch(target);
    return function dispatchWithQueue(envelope: AnyEnvelope) {
        if (isSystemEnvelope(envelope)) {
            dispatch(envelope);
        } else {
            promise
                .then(() => {
                    console.log('>> SEND', envelope.type);
                    dispatch(envelope);
                })
                .catch(loggerProvider.error);
        }
    };
}

export function dispatch<T extends EnvelopeDispatchTarget, E extends ExtractEnvelope<T>>(target: T, envelope: E) {
    createDispatch(target)(envelope);
}
