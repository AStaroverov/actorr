import {requestFactory} from "./src/request";

export type { TActor, TMailbox, TEnvelope } from './src/types';
export { createEnvelope, shallowCopyEnvelope } from './src/envelope';
export { requestFactory } from './src/request';
export { createResponseFactory } from './src/response';
export { createActorFactory } from './src/createActorFactory';
export { connectActorToActor } from './src/connectActorToActor';

export type { TMessagePortName } from './src/worker/types';
export { onConnectMessagePort } from './src/worker/onConnectMessagePort';
export { connectActorToWorker, connectWorkerToActor } from './src/worker/connectWorker';
export { connectMessagePortToActor, connectActorToMessagePort } from './src/worker/connectMessagePort';
export { DISCONNECT_MESSAGE_PORT_TYPE, CONNECT_MESSAGE_PORT_TYPE } from './src/worker/defs';

export { getMessagePortName } from './src/utils';

// Advanced public methods
export { getAllMessagePorts, getMessagePort, setMessagePort, deleteMessagePort, onMessagePortFinalize } from './src/worker/ports';
