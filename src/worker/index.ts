import { lock, subscribeOnUnlock } from '../utils/Locks';
import { threadId } from '../utils/thread';
import { loggerProvider } from '../providers';

export * from './connectActorToMessagePort';
export * from './connectActorToWorker';
export * from './onConnectMessagePort';

// We must lock thread at root level to prevent thread silent termination
lock(threadId);
subscribeOnUnlock(threadId, () => {
    loggerProvider.error(`Thread[${threadId}] terminated without reason.`);
});
