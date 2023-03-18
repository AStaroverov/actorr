import type { ConnectEnvelope, DisconnectEnvelope, MessagePortName } from './types';
import { isEnvelope } from '../envelope';
import { setMessagePort, deleteMessagePort, onMessagePortFinalize } from './ports';
import {
    isSharedWorkerScope,
    isDedicatedWorkerScope,
    CONNECT_MESSAGE_PORT_TYPE,
    DISCONNECT_MESSAGE_PORT_TYPE,
} from './defs';
import { noop } from '../utils';

const dependencies = <const>{
    isDedicatedWorkerScope,
    isSharedWorkerScope,
    setMessagePort,
    deleteMessagePort,
};

export function onConnectMessagePort(
    context: DedicatedWorkerGlobalScope | SharedWorkerGlobalScope,
    callback: (name: MessagePortName) => unknown | Function,
    { isDedicatedWorkerScope, isSharedWorkerScope, setMessagePort, deleteMessagePort } = dependencies,
): VoidFunction {
    if (isDedicatedWorkerScope(context)) {
        context.addEventListener('message', onMessage);
        return () => context.removeEventListener('message', onMessage);
    }

    if (isSharedWorkerScope(context)) {
        const callback = (event: MessageEvent) => {
            event.ports[0].start();
            event.ports[0].addEventListener('message', onMessage);
        };

        context.addEventListener('connect', callback);
        return () => context.removeEventListener('connect', callback);
    }

    return noop;

    function onMessage(event: MessageEvent) {
        const itIs = isEnvelope(event.data);

        if (itIs && event.data.type === CONNECT_MESSAGE_PORT_TYPE) {
            const envelope = event.data as ConnectEnvelope;
            const name = envelope.payload;
            const port = event.ports[0];

            setMessagePort(name, port);
            port.start();
            const onFinalize = callback(name);

            if (typeof onFinalize === 'function') {
                onMessagePortFinalize(name, onFinalize);
            }
        }

        if (itIs && event.data.type === DISCONNECT_MESSAGE_PORT_TYPE) {
            const envelope = event.data as DisconnectEnvelope;
            const name = envelope.payload;

            deleteMessagePort(name);
        }
    }
}
