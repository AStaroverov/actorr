import type { ConnectEnvelope, DisconnectEnvelope } from './types';
import { isEnvelope } from '../envelope';
import {
    CONNECT_MESSAGE_PORT_TYPE,
    DISCONNECT_MESSAGE_PORT_TYPE,
    isDedicatedWorkerScope,
    isSharedWorkerScope,
} from './defs';
import { checkPortAsReady, isPortReadyCheck, noop } from '../utils';
import { currentThreadId, subscribeOnThreadTerminate } from '../locks';

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
        const listener = createListener(context, onConnect);
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

function createListener(
    port: MessagePort | DedicatedWorkerGlobalScope,
    callback: (name: string, port: MessagePort) => void | Function,
) {
    const mapPortNameToUnsubscribe = new Map<string, Function>();

    // fast ready confirmation
    checkPortAsReady(port);

    return function listener(event: MessageEvent) {
        if (isPortReadyCheck(event)) return checkPortAsReady(port);

        if (!isEnvelope(event.data)) return;

        if (event.data.type === CONNECT_MESSAGE_PORT_TYPE) {
            const envelope = event.data as ConnectEnvelope;
            const name = envelope.payload;
            const port = event.ports[0];
            const disposes: Array<Function> = [];
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

        if (event.data.type === DISCONNECT_MESSAGE_PORT_TYPE) {
            const envelope = event.data as DisconnectEnvelope;
            const name = envelope.payload;

            mapPortNameToUnsubscribe.get(name)?.();
        }
    };
}
