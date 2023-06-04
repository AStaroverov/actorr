export function getWorkerMessagePort(worker: Worker | SharedWorker): MessagePort {
    return (worker instanceof SharedWorker ? worker.port : worker) as MessagePort;
}
