import { createEnvelope } from '../envelope';
import { CONNECT_MESSAGE_PORT_TYPE, DISCONNECT_MESSAGE_PORT_TYPE } from './defs';
import { getMessagePortName } from '../utils';
import { getWorkerPostMessage } from './utils';
import { waitWorker } from './waitWorker';

export async function connectWorkerToWorker<W1 extends Worker | SharedWorker, W2 extends Worker | SharedWorker>(
    worker1: { name: string; worker: W1 },
    worker2: { name: string; worker: W1 },
) {
    await Promise.all([waitWorker(worker1.worker), waitWorker(worker2.worker)]);

    const channel = new MessageChannel();

    const workerName1 = getMessagePortName(worker1.name);
    const workerName2 = getMessagePortName(worker2.name);

    const postMessage1 = getWorkerPostMessage(worker1.worker);
    const postMessage2 = getWorkerPostMessage(worker2.worker);

    postMessage1(createEnvelope(CONNECT_MESSAGE_PORT_TYPE, workerName2), [channel.port2]);
    postMessage2(createEnvelope(CONNECT_MESSAGE_PORT_TYPE, workerName1), [channel.port1]);

    return () => {
        postMessage1(createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, workerName2));
        postMessage2(createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, workerName1));
        channel.port1.close();
        channel.port2.close();
    };
}
