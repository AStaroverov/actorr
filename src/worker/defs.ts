export const isWindowScope = (context: unknown): context is Window =>
    typeof Window !== 'undefined' && context instanceof Window;
export const isSharedWorkerScope = (context: unknown): context is SharedWorkerGlobalScope =>
    typeof SharedWorkerGlobalScope !== 'undefined' && context instanceof SharedWorkerGlobalScope;
export const isDedicatedWorkerScope = (context: unknown): context is DedicatedWorkerGlobalScope =>
    typeof DedicatedWorkerGlobalScope !== 'undefined' && context instanceof DedicatedWorkerGlobalScope;

export const CONNECT_THREAD_TYPE = '__CONNECT_THREAD__' as const;
export const DISCONNECT_THREAD_TYPE = '__DISCONNECT_THREAD__' as const;
