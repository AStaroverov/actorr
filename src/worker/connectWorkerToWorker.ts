import { createEnvelope } from '../envelope';
import { CONNECT_MESSAGE_PORT_TYPE, DISCONNECT_MESSAGE_PORT_TYPE } from './defs';
import { createMessagePortName } from '../utils';
import { getWorkerMessagePort, waitWorker } from './utils';

export async function connectWorkerToWorker<W1 extends Worker | SharedWorker, W2 extends Worker | SharedWorker>(
    worker1: { name: string; worker: W1 },
    worker2: { name: string; worker: W1 },
) {
    await Promise.all([waitWorker(worker1.worker), waitWorker(worker2.worker)]);

    const channel = new MessageChannel();

    const workerName1 = createMessagePortName(worker1.name);
    const workerName2 = createMessagePortName(worker2.name);

    const messagePort1 = getWorkerMessagePort(worker1.worker);
    const messagePort2 = getWorkerMessagePort(worker2.worker);

    messagePort1.postMessage(createEnvelope(CONNECT_MESSAGE_PORT_TYPE, workerName2), [channel.port2]);
    messagePort2.postMessage(createEnvelope(CONNECT_MESSAGE_PORT_TYPE, workerName1), [channel.port1]);

    return () => {
        messagePort1.postMessage(createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, workerName2));
        messagePort2.postMessage(createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, workerName1));
        channel.port1.close();
        channel.port2.close();
    };
}
