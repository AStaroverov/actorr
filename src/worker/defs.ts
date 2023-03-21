export const isSharedWorkerScope = (context: unknown): context is SharedWorkerGlobalScope =>
    typeof SharedWorkerGlobalScope !== 'undefined' && context instanceof SharedWorkerGlobalScope;
export const isDedicatedWorkerScope = (context: unknown): context is DedicatedWorkerGlobalScope =>
    typeof DedicatedWorkerGlobalScope !== 'undefined' && context instanceof DedicatedWorkerGlobalScope;

export const PING = '__PING__' as const;
export const PONG = '__PONG__' as const;
export const CONNECT_MESSAGE_PORT_TYPE = '__CONNECT_MESSAGE_PORT__' as const;
export const DISCONNECT_MESSAGE_PORT_TYPE = '__DISCONNECT_MESSAGE_PORT__' as const;
