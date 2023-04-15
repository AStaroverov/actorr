import type { ConnectEnvelope, DisconnectEnvelope } from './types';
import { isEnvelope } from '../envelope';
import {
    CONNECT_MESSAGE_PORT_TYPE,
    DISCONNECT_MESSAGE_PORT_TYPE,
    isDedicatedWorkerScope,
    isSharedWorkerScope,
} from './defs';
import { isCheckReady, noop, readyMessagePort } from '../utils';
import { currentThreadId, subscribeOnThreadTerminate } from '../locks';

const dependencies = <const>{
    isDedicatedWorkerScope,
    isSharedWorkerScope,
};

export function onConnectMessagePort(
    context: DedicatedWorkerGlobalScope | SharedWorkerGlobalScope,
    callback: (port: MessagePort) => void | Function,
    { isDedicatedWorkerScope, isSharedWorkerScope } = dependencies,
): VoidFunction {
    if (isDedicatedWorkerScope(context)) {
        const listener = createListener(context);
        context.addEventListener('message', listener);
        return () => context.removeEventListener('message', listener);
    }

    if (isSharedWorkerScope(context)) {
        const callback = (event: MessageEvent) => {
            const port = event.ports[0];
            const listener = createListener(port);

            port.start();
            port.addEventListener('message', listener);
        };

        context.addEventListener('connect', callback);
        return () => context.removeEventListener('connect', callback);
    }

    return noop;

    function createListener(port: MessagePort | DedicatedWorkerGlobalScope) {
        const mapPortNameToUnsubscribe = new Map<string, Function>();

        // fast ready confirmation
        readyMessagePort(port);

        return function listener(event: MessageEvent) {
            if (isCheckReady(event)) return readyMessagePort(port);

            if (!isEnvelope(event.data)) return;

            if (event.data.type === CONNECT_MESSAGE_PORT_TYPE) {
                const envelope = event.data as ConnectEnvelope;
                const name = envelope.payload;
                const port = event.ports[0];

                port.start();

                const disposes: Array<Function> = [];
                const disconnect = () => disposes.forEach((dispose) => dispose());
                const callbackDispose = callback(port);

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
}
