import { createShortRandomString } from './utils';
import { isDedicatedWorkerScope, isSharedWorkerScope, isWindowScope } from './worker/defs';

const threadName = isSharedWorkerScope(self)
    ? `${self.name}(sharedWorker)`
    : isDedicatedWorkerScope(self)
    ? `${self.name}(dedicatedWorker)`
    : isWindowScope(self)
    ? 'window'
    : 'unknown';
export const threadId = `${threadName}[${createShortRandomString()}]`;

// lock the thread as alive
void navigator.locks.request(threadId, () => new Promise(() => {}));

export function subscribeOnThreadTerminate(threadId: string, callback: Function) {
    const locksController = new AbortController();
    void navigator.locks.request(threadId, { signal: locksController.signal }, callback as () => void);
    return () => locksController.abort();
}
