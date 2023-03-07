import { createEnvelope } from '../envelope';
import { CONNECT_MESSAGE_PORT_TYPE, DISCONNECT_MESSAGE_PORT_TYPE } from './defs';
import { getMessagePortName } from '../utils';

export function connectWorkerToWorker<W1 extends Worker | SharedWorker, W2 extends Worker | SharedWorker>(
    worker1: { name: string; worker: W1 },
    worker2: { name: string; worker: W1 },
) {
    const channel = new MessageChannel();

    const workerName1 = getMessagePortName(worker1.name);
    const workerName2 = getMessagePortName(worker2.name);

    const dispatchToWorker1 = getWorkerDispatcher(worker1.worker);
    const dispatchToWorker2 = getWorkerDispatcher(worker2.worker);

    dispatchToWorker1(createEnvelope(CONNECT_MESSAGE_PORT_TYPE, workerName2), [channel.port2]);
    dispatchToWorker2(createEnvelope(CONNECT_MESSAGE_PORT_TYPE, workerName1), [channel.port1]);

    return () => {
        dispatchToWorker1(createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, workerName2));
        dispatchToWorker2(createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, workerName1));
    };
}

function getWorkerDispatcher(worker: Worker | SharedWorker) {
    return worker instanceof SharedWorker ? worker.port.postMessage.bind(worker.port) : worker.postMessage.bind(worker);
}
