import {createActorFactory, TEnvelope} from "../../../main";
import {TMailbox} from "../../../main";

export const createMailbox = <In extends TEnvelope<any, any>>(): TMailbox<In> => {
    const callbacks = new Set<(envelope: In) => unknown>();

    return {
        dispatch(envelope: In) {
            for (let callback of callbacks) {
                callback(envelope);
            }
        },
        subscribe(callback: (envelope: In) => unknown) {
            callbacks.add(callback)
        },
        unsubscribe(callback: (envelope: In) => unknown) {
            callbacks.delete(callback)
        }
    }
}
export const createActor = createActorFactory({ getMailbox: () => createMailbox() });