import type { AnyEnvelope, Mailbox } from '../../../src';
import { createActorFactory } from '../../../src';

export const createMailbox = <T extends AnyEnvelope>(): Mailbox<T> => {
    const callbacks = new Set<(envelope: T) => unknown>();

    return {
        dispatch(envelope: T) {
            const current = Array.from(callbacks);
            for (let callback of current) {
                callback(envelope);
            }
        },
        subscribe(callback: (envelope: T) => unknown) {
            callbacks.add(callback);
            return () => callbacks.delete(callback);
        },
    };
};
export const createActor = createActorFactory({ getMailbox: () => createMailbox() });
