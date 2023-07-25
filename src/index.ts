import { lockThread } from './locks';

// We must lock thread at root level to prevent thread silent termination
lockThread();

export * from './providers';

export * from './types';
export { createEnvelope, isEnvelope } from './envelope';
export { createActorFactory } from './createActorFactory';

export { connectActorToActor } from './connectActorToActor';

export { createRequest } from './request/request';
export { createResponseFactory } from './request/response';

export * from './channel/types';
export { ChannelCloseReason } from './channel/defs';
export { openChannelFactory } from './channel/openChannelFactory';
export { supportChannelFactory } from './channel/supportChannelFactory';
export type { HeartbeatOptions } from './heartbeat';
export { createHeartbeat } from './heartbeat';

export * from './worker/types';
export { onConnectMessagePort } from './worker/onConnectMessagePort';
export { connectActorToWorker, connectWorkerToActor } from './worker/connectActorToWorker';
export { connectMessagePortToActor, connectActorToMessagePort } from './worker/connectActorToMessagePort';

export { createDispatch, dispatch } from './dispatch';
export { createSubscribe, subscribe } from './subscribe';

// we need more tests to export this
// export { connectWorkerToWorker } from './worker/connectWorkerToWorker';
export { createMessagePortName } from './utils/MessagePort';
