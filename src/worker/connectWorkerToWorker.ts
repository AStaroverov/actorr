import {createEnvelope} from "../envelope";
import {CONNECT_MESSAGE_PORT_TYPE, DISCONNECT_MESSAGE_PORT_TYPE} from "./defs";

export function connectWorkerToWorker
<W1 extends Worker | SharedWorker, W2 extends Worker | SharedWorker>(
    worker1: {name: string, worker: W1},
    worker2: {name: string, worker: W1},
) {
    const channel = new MessageChannel();
    const dispatchToWorker1 = getWorkerDispatcher(worker1.worker);
    const dispatchToWorker2 = getWorkerDispatcher(worker2.worker);

    dispatchToWorker1(createEnvelope(CONNECT_MESSAGE_PORT_TYPE, worker2.name), [channel.port2]);
    dispatchToWorker2(createEnvelope(CONNECT_MESSAGE_PORT_TYPE, worker1.name), [channel.port1]);

    return () => {
        dispatchToWorker1(createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, worker2.name));
        dispatchToWorker2(createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, worker1.name));
    }
}

function getWorkerDispatcher(worker: Worker | SharedWorker) {
    return worker instanceof SharedWorker
        ? worker.port.postMessage.bind(worker.port)
        : worker.postMessage.bind(worker);
}