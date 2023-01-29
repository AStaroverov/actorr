import {TActor, TEnvelope} from "../types";
import {createEnvelope, isEnvelope} from "../envelope";
import {CONNECT_MESSAGE_PORT_TYPE, DISCONNECT_MESSAGE_PORT_TYPE} from "./defs";
import {connectActorToMessagePort} from "./connectActorToMessagePort";

export function connectActorToWorker<A extends TActor<TEnvelope<any, any>>, W extends Worker | SharedWorker>(actor: A, worker: W) {
    const channel = new MessageChannel();
    const localPort = channel.port1;
    const dispatchToWorker = worker instanceof SharedWorker
        ? worker.port.postMessage.bind(worker.port)
        : worker.postMessage.bind(worker);

    const disconnect = connectActorToMessagePort(actor, localPort);

    localPort.start();
    dispatchToWorker(createEnvelope(CONNECT_MESSAGE_PORT_TYPE, actor.name), [channel.port2]);

    return () => {
        disconnect();
        dispatchToWorker(createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, actor.name));
        localPort.close();
    }
}
