import { waitMessagePort } from '../utils';

export function getWorkerMessagePort(worker: Worker | SharedWorker): MessagePort {
    return (worker instanceof SharedWorker ? worker.port : worker) as MessagePort;
}

export function waitWorker(worker: Worker | SharedWorker) {
    return waitMessagePort(getWorkerMessagePort(worker));
}
