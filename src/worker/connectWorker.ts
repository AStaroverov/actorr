import {TActor, TAnyEnvelope} from "../types";
import {createEnvelope} from "../envelope";
import {CONNECT_MESSAGE_PORT_TYPE, DISCONNECT_MESSAGE_PORT_TYPE} from "./defs";
import {connectActorToMessagePort} from "./connectMessagePort";
import {TSourceWithMapper} from "../utils/types";
import {getMessagePortName, getMapper, getSource} from "../utils";

export function connectActorToWorker
<A extends TActor<TAnyEnvelope, TAnyEnvelope>, W extends Worker | SharedWorker>
(_actor: A | TSourceWithMapper<A>, _worker: W | TSourceWithMapper<W>) {
    const actor = getSource(_actor);
    const worker = getSource(_worker);
    const mapper = getMapper(_worker);

    const channel = new MessageChannel();
    const localPort = channel.port1;
    const workerPort = channel.port2;
    const workerPortName = getMessagePortName(actor.name);

    const dispatchToWorker = worker instanceof SharedWorker
        ? worker.port.postMessage.bind(worker.port)
        : worker.postMessage.bind(worker);

    const disconnect = connectActorToMessagePort(_actor, { source: localPort, map: mapper });

    localPort.start();
    dispatchToWorker(createEnvelope(CONNECT_MESSAGE_PORT_TYPE, workerPortName), [workerPort]);

    return () => {
        disconnect();
        dispatchToWorker(createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, workerPortName));
        localPort.close();
    }
}

export function connectWorkerToActor
<A extends TActor<TAnyEnvelope, TAnyEnvelope>, W extends Worker | SharedWorker>
(_worker: W | TSourceWithMapper<W>,_actor: A | TSourceWithMapper<A>) {
    return connectActorToWorker(_actor, _worker);
}