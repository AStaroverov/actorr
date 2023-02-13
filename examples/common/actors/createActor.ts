import {createActorFactory, TEnvelope} from "../../../main";
import {TMailbox} from "../../../main";

export const createMailbox = <T extends TEnvelope<any, any>>(): TMailbox<T> => {
    const callbacks = new Set<(envelope: T) => unknown>();

    return {
        dispatch(envelope: T) {
            const current = Array.from(callbacks);
            for (let callback of current) {
                callback(envelope);
            }
        },
        subscribe(callback: (envelope: T) => unknown) {
            callbacks.add(callback)
        },
        unsubscribe(callback: (envelope: T) => unknown) {
            callbacks.delete(callback)
        }
    }
}
export const createActor = createActorFactory({ getMailbox: () => createMailbox() });