import { getWorkerAddEventListener, getWorkerPostMessage, getWorkerRemoveEventListener } from './utils';
import { PING, PONG } from './defs';

export function waitWorker(worker: Worker | SharedWorker) {
    const postMessage = getWorkerPostMessage(worker);
    const addEventListener = getWorkerAddEventListener(worker);
    const removeEventListener = getWorkerRemoveEventListener(worker);
    const intervalId = setInterval(() => postMessage(PING), 25);

    return new Promise((resolve) => {
        const listener = (event: MessageEvent) => {
            if (event.data === PONG) {
                resolve(undefined);
                clearInterval(intervalId);
                removeEventListener('message', listener);
            }
        };

        addEventListener('message', listener);
    });
}
