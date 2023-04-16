import { createShortRandomString, noop } from './utils';
import { isDedicatedWorkerScope, isSharedWorkerScope, isWindowScope } from './worker/defs';
import { timeoutProvider } from './providers';

const webLocksSupported = globalThis.navigator !== undefined && globalThis.navigator.locks !== undefined;

if (!webLocksSupported && process.env.NODE_ENV !== 'test') {
    console.warn('navigator.locks is not implemented, that means that WebActor cannot detect thread termination');
}

const threadName = isSharedWorkerScope(globalThis)
    ? `${self.name}(sharedWorker)`
    : isDedicatedWorkerScope(globalThis)
    ? `${self.name}(dedicatedWorker)`
    : isWindowScope(globalThis)
    ? 'window'
    : 'unknown';
export const currentThreadId = `${threadName}[${createShortRandomString()}]`;

export const lockThread = webLocksSupported
    ? () => navigator.locks.request(currentThreadId, () => new Promise(noop))
    : noop;

export const subscribeOnThreadTerminate = webLocksSupported
    ? function subscribeOnThreadTerminate(threadId: string, callback: () => void) {
          const locksController = new AbortController();
          // if we call navigator.locks.request from 2 threads at same time, it will have unknown order
          // I hope, that setTimeout will help to avoid this and 50ms is enough
          const delayId = timeoutProvider.setTimeout(() => {
              void navigator.locks
                  .request(threadId, { signal: locksController.signal }, callback as () => void)
                  .catch(noop);
          }, 50);

          return () => {
              timeoutProvider.clearTimeout(delayId);
              locksController.abort();
          };
      }
    : function subscribeOnThreadTerminate() {
          return noop;
      };
