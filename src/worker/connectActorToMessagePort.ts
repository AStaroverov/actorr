import { getMessagePort as getMessagePortByName, onMessagePortFinalize } from './ports';
import {TMessagePortName} from "./types";
import {TActor, TEnvelope} from "../types";
import { isEnvelope } from '../envelope';

export function connectActorToMessagePort<T extends TEnvelope<any, any>>(
    actor: TActor<T>,
    port: MessagePort | TMessagePortName,
) {
    const envelopes = new WeakSet<T>();
    const isInstance = port instanceof MessagePort;
    const getMessagePort = () => isInstance ? port : getMessagePortByName(port);
    const onPortMessage = ({ data }: MessageEvent<unknown | T>) => {
        if (isEnvelope(data)) {
            envelopes.add(data as T);
            actor.dispatch(data as T);
        }
    }
    const onMailboxEnvelope = (envelope: T) => {
        if (!envelopes.has(envelope)) {
            try {
                getMessagePort()?.postMessage(envelope, envelope.transferable as any);
            } catch (err) {
                console.error(err);
            }
        }
    };
    const disconnect = () => {
        getMessagePort()?.removeEventListener('message', onPortMessage);
        actor.mailbox.unsubscribe(onMailboxEnvelope);
    }

    getMessagePort()?.addEventListener('message', onPortMessage);
    actor.mailbox.subscribe(onMailboxEnvelope);

    if (!isInstance) {
        onMessagePortFinalize(port, disconnect);
    }

    return disconnect;
}
