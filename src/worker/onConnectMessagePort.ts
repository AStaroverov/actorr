import {
    CONNECT_MESSAGE_PORT_TYPE,
    DISCONNECT_MESSAGE_PORT_TYPE,
    isDedicatedWorkerScope,
    isSharedWorkerScope,
} from './defs';
import { checkPortAsReadyOnMessage, noop, setPortName } from '../utils';
import { currentThreadId, subscribeOnThreadTerminate } from '../locks';
import { isEnvelope } from '../envelope';
import { ConnectEnvelope, DisconnectEnvelope } from './types';

const dependencies = <const>{
    isDedicatedWorkerScope,
    isSharedWorkerScope,
};

export function onConnectMessagePort(
    context: DedicatedWorkerGlobalScope | SharedWorkerGlobalScope,
    onConnect: (name: string, port: MessagePort) => void | Function,
    { isDedicatedWorkerScope, isSharedWorkerScope } = dependencies,
): Function {
    if (isDedicatedWorkerScope(context)) {
        const listener = createListener(context as unknown as MessagePort, onConnect);
        context.addEventListener('message', listener);
        return () => context.removeEventListener('message', listener);
    }

    if (isSharedWorkerScope(context)) {
        const callback = (event: MessageEvent) => {
            const port = event.ports[0];
            const listener = createListener(port, onConnect);
            port.start();
            port.addEventListener('message', listener);
        };

        context.addEventListener('connect', callback);
        return () => context.removeEventListener('connect', callback);
    }

    return noop;
}

function createListener(port: MessagePort, callback: (name: string, port: MessagePort) => void | Function) {
    const mapPortNameCount = new Map<string, number>();
    const mapPortNameToUnsubscribe = new Map<string, Function>();

    return function listener(event: MessageEvent) {
        checkPortAsReadyOnMessage(event);

        if (!isEnvelope(event.data)) return;

        if (event.data.type === CONNECT_MESSAGE_PORT_TYPE) {
            const envelope = event.data as ConnectEnvelope;
            const name = envelope.payload;

            mapPortNameCount.set(name, (mapPortNameCount.get(name) ?? 0) + 1);

            if (!mapPortNameToUnsubscribe.has(name)) {
                setPortName(port, name);

                const disposes: Array<Function> = [
                    () => {
                        mapPortNameCount.delete(name);
                        mapPortNameToUnsubscribe.delete(name);
                    },
                ];
                const disconnect = () => disposes.forEach((dispose) => dispose());
                const callbackDispose = callback(name, port);

                if (callbackDispose !== undefined) {
                    disposes.push(callbackDispose);
                }

                if (currentThreadId !== envelope.threadId) {
                    disposes.push(subscribeOnThreadTerminate(envelope.threadId, disconnect));
                }

                mapPortNameToUnsubscribe.set(name, disconnect);
            }
        }

        if (event.data.type === DISCONNECT_MESSAGE_PORT_TYPE) {
            const envelope = event.data as DisconnectEnvelope;
            const name = envelope.payload;
            const count = (mapPortNameCount.get(name) ?? 1) - 1;

            if (count > 0) {
                mapPortNameCount.set(name, count);
            } else {
                mapPortNameToUnsubscribe.get(name)?.();
            }
        }
    };
}
