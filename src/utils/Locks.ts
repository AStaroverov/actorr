import { locksProvider, loggerProvider, timeoutProvider } from '../providers';
import { Defer } from './Defer';
import { noop } from './common';

const webLocksSupported = globalThis.navigator !== undefined && globalThis.navigator.locks !== undefined;

if (!webLocksSupported && process.env.NODE_ENV !== 'test') {
    loggerProvider.error('navigator.locks is not implemented');
}

export function lock(key: string) {
    loggerProvider.info('Lock ', key);
    const defer = new Defer();
    void locksProvider.request(key, () => defer.promise);
    return () => defer.resolve(undefined);
}

export const subscribeOnUnlock = function subscribeOnThreadTerminate(threadId: string, callback: () => void) {
    const locksController = new AbortController();
    // if we call locksProvider.request from 2 threads at same time, it will have unknown order
    // I hope, that setTimeout will help to avoid this and 50ms is enough
    const delayId = timeoutProvider.setTimeout(() => {
        void locksProvider
            .request(threadId, { signal: locksController.signal }, () => {
                loggerProvider.info('Unlocked ', threadId);
                callback();
            })
            .catch(noop);
    }, 50);

    return () => {
        timeoutProvider.clearTimeout(delayId);
        locksController.abort();
    };
};
