export type { TActor, TMailbox, TEnvelope } from './src/types';
export { createEnvelope } from './src/envelope';
export { createActorFactory } from './src/createActorFactory';
export { connectActorToActor } from './src/connectActorToActor';

export type { TMessagePortName } from './src/worker/types';
export { connectActorToWorker } from './src/worker/connectActorToWorker';
export { onConnectMessagePort } from './src/worker/onConnectMessagePort';
export { connectActorToMessagePort } from './src/worker/connectActorToMessagePort';
export { DISCONNECT_MESSAGE_PORT_TYPE, CONNECT_MESSAGE_PORT_TYPE } from './src/worker/defs';

// Advanced public methods
export { getAllMessagePorts, getMessagePort, setMessagePort, deleteMessagePort, onMessagePortFinalize } from './src/worker/ports';
