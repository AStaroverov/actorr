import {isSharedWorker, isWorker, CONNECT_MESSAGE_PORT_TYPE, DISCONNECT_MESSAGE_PORT_TYPE} from "./defs";
import {isEnvelope} from "../envelope";
import {TConnectEnvelope, TDisconnectEnvelope, TMessagePortName} from "./types";
import {setMessagePort, deleteMessagePort, onMessagePortFinalize} from "./ports";

export function onConnectMessagePort(callback: (name: TMessagePortName) => (unknown | Function)): void {
    if (isWorker) {
        (self as unknown as MessagePort).addEventListener('message', onMessage);
    }

    if (isSharedWorker) {
        (self as unknown as SharedWorkerGlobalScope).addEventListener('connect', (event: MessageEvent) => {
            event.ports[0].addEventListener('message', onMessage);
        });
    }

    function onMessage(event: MessageEvent) {
        const itIs = isEnvelope(event.data);

        if (itIs && event.data.type === CONNECT_MESSAGE_PORT_TYPE) {
            const envelope = event.data as TConnectEnvelope;
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
            const envelope = event.data as TDisconnectEnvelope;
            const name = envelope.payload;

            deleteMessagePort(name);
        }
    }
}
