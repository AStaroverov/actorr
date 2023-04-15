import type { ConnectEnvelope, DisconnectEnvelope, MessagePortName } from './types';
import { isEnvelope } from '../envelope';
import { deleteMessagePort, onMessagePortFinalize, setMessagePort } from './ports';
import {
    CONNECT_MESSAGE_PORT_TYPE,
    DISCONNECT_MESSAGE_PORT_TYPE,
    isDedicatedWorkerScope,
    isSharedWorkerScope,
} from './defs';
import { isCheckReady, noop, readyMessagePort } from '../utils';

const dependencies = <const>{
    isDedicatedWorkerScope,
    isSharedWorkerScope,
    setMessagePort,
    deleteMessagePort,
};

export function onConnectMessagePort(
    context: DedicatedWorkerGlobalScope | SharedWorkerGlobalScope,
    callback: (name: MessagePortName) => void | Function,
    { isDedicatedWorkerScope, isSharedWorkerScope, setMessagePort, deleteMessagePort } = dependencies,
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
                setMessagePort(name, port);

                const dispose = callback(name);

                if (typeof dispose === 'function') {
                    onMessagePortFinalize(name, dispose);
                }
            }

            if (event.data.type === DISCONNECT_MESSAGE_PORT_TYPE) {
                const envelope = event.data as DisconnectEnvelope;
                const name = envelope.payload;

                deleteMessagePort(name);
            }
        };
    }
}
