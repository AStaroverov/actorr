import {getMessagePort as getMessagePortByName} from './ports';
import {TMessagePortName} from "./types";
import {TActor, TEnvelope} from "../types";
import {isEnvelope} from '../envelope';

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
            queueMicrotask(() => {
                try {
                    actor.dispatch(data as T)
                } catch (err) {
                    console.error(err);
                }
            });
        }
    }
    const onMailboxEnvelope = (envelope: T) => {
        if (!envelopes.has(envelope)) {
            queueMicrotask(() => {
                try {
                    getMessagePort()?.postMessage(envelope, envelope.transferable as any)
                } catch (err) {
                    console.error(err);
                }
            });
        }
    };

    getMessagePort()?.addEventListener('message', onPortMessage);
    actor.mailbox.subscribe(onMailboxEnvelope);

    return () => {
        getMessagePort()?.removeEventListener('message', onPortMessage);
        actor.mailbox.unsubscribe(onMailboxEnvelope);
    }
}
