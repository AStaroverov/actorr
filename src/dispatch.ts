import type { EnvelopeDispatchTarget, ExtractEnvelope } from './types';
import { AnyEnvelope } from './types';
import { waitMessagePort } from './utils';

const mapPortToReady = new WeakMap<MessagePort, true | Promise<unknown>>();
export const createDispatchWithQueue = (port: MessagePort) => {
    if (!mapPortToReady.has(port)) {
        mapPortToReady.set(
            port,
            waitMessagePort(port).then(() => mapPortToReady.set(port, true)),
        );
    }

    const postMessage = (envelope: AnyEnvelope) => {
        try {
            port.postMessage(envelope, envelope.transferable as any);
        } catch (err) {
            console.error(err);
        }
    };

    return function dispatchWithQueue(envelope: AnyEnvelope) {
        const isReadyOrPromise = mapPortToReady.get(port);

        if (isReadyOrPromise === undefined) throw new Error('Impossible state');
        if (isReadyOrPromise === true) return postMessage(envelope);
        isReadyOrPromise.then(() => postMessage(envelope));
    };
};

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
