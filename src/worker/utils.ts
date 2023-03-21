export function getWorkerPostMessage(worker: Worker | SharedWorker) {
    return worker instanceof SharedWorker ? worker.port.postMessage.bind(worker.port) : worker.postMessage.bind(worker);
}

export function getWorkerAddEventListener(worker: Worker | SharedWorker) {
    return worker instanceof SharedWorker
        ? worker.port.addEventListener.bind(worker.port)
        : worker.addEventListener.bind(worker);
}

export function getWorkerRemoveEventListener(worker: Worker | SharedWorker) {
    return worker instanceof SharedWorker
        ? worker.port.removeEventListener.bind(worker.port)
        : worker.removeEventListener.bind(worker);
}
