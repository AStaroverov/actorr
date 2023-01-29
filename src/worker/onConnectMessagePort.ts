import {isSharedWorker, isWorker, CONNECT_MESSAGE_PORT_TYPE, DISCONNECT_MESSAGE_PORT_TYPE} from "./defs";
import {isEnvelope} from "../envelope";
import {TConnectEnvelope, TDisconnectEnvelope, TMessagePortName} from "./types";
import {addMessagePort, getMessagePort, hasMessagePort} from "./ports";

export function onConnectMessagePort(callback: (name: TMessagePortName) => void): void {
    if (isWorker) {
        (self as unknown as MessagePort).addEventListener('message', onMessage);
    }

    if (isSharedWorker) {
        (self as unknown as SharedWorkerGlobalScope).addEventListener('connect', (event: MessageEvent) => {
            event.ports[0].addEventListener('message', onMessage);
        });
    }

    function onMessage(event: MessageEvent) {
        if (isEnvelope(event.data) && event.data.type === CONNECT_MESSAGE_PORT_TYPE) {
            const envelope = event.data as TConnectEnvelope;
            const name = envelope.payload;
            const port = event.ports[0];

            if (!hasMessagePort(name)) {
                addMessagePort(name, port);
                port.start();
                callback(name);
            }
        }
        if (isEnvelope(event.data) && event.data.type === DISCONNECT_MESSAGE_PORT_TYPE) {
            const envelope = event.data as TDisconnectEnvelope;
            const name = envelope.payload;

            getMessagePort(name)?.close();
        }
    }
}
