import { createShortRandomString, noop } from './utils';
import { isDedicatedWorkerScope, isSharedWorkerScope, isWindowScope } from './worker/defs';

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

export const lockThread = webLocksSupported ? () => navigator.locks.request.bind(navigator.locks) : noop;

export const subscribeOnThreadTerminate = webLocksSupported
    ? function subscribeOnThreadTerminate(threadId: string, callback: Function) {
          const locksController = new AbortController();
          void navigator.locks
              .request(threadId, { signal: locksController.signal }, callback as () => void)
              .catch(noop);
          return () => locksController.abort();
      }
    : function subscribeOnThreadTerminate() {
          return noop;
      };
