export const isSharedWorker =
    typeof SharedWorkerGlobalScope !== 'undefined' && self instanceof SharedWorkerGlobalScope;
export const isWorker =
    !isSharedWorker &&
    typeof WorkerGlobalScope !== 'undefined' &&
    self instanceof WorkerGlobalScope;

export const CONNECT_MESSAGE_PORT_TYPE = '__CONNECT_MESSAGE_PORT__' as const;
export const DISCONNECT_MESSAGE_PORT_TYPE = '__DISCONNECT_MESSAGE_PORT__' as const;
