import { createShortRandomString, noop } from './utils';
import { isDedicatedWorkerScope, isSharedWorkerScope, isWindowScope } from './worker/defs';

const threadName = isSharedWorkerScope(globalThis)
    ? `${self.name}(sharedWorker)`
    : isDedicatedWorkerScope(globalThis)
    ? `${self.name}(dedicatedWorker)`
    : isWindowScope(globalThis)
    ? 'window'
    : 'unknown';
export const currentThreadId = `${threadName}[${createShortRandomString()}]`;

export const subscribeOnThreadTerminate = (() => {
    if (globalThis.navigator === undefined || globalThis.navigator.locks === undefined)
        return function subscribeOnThreadTerminate() {
            process.env.NODE_ENV !== 'test' &&
                console.warn(
                    'navigator.locks is not implemented, that means that WebActor cannot detect thread termination',
                );
            return noop;
        };

    // lock the thread as alive
    void navigator.locks.request(currentThreadId, () => new Promise(() => {}));

    return function subscribeOnThreadTerminate(threadId: string, callback: Function) {
        const locksController = new AbortController();
        void navigator.locks.request(threadId, { signal: locksController.signal }, callback as () => void).catch(noop);
        return () => locksController.abort();
    };
})();
