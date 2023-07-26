import { Actor, EnvelopeTransmitterWithMapper } from '../types';
import { createEnvelope } from '../envelope';
import { connectActorToMessagePort } from './connectActorToMessagePort';
import { getEnvelopeTransmitter, getTransmitterMapper } from '../utils/common';
import { getWorkerMessagePort } from './utils';
import { createDispatch } from '../dispatch';
import { CONNECT_THREAD_TYPE, DISCONNECT_THREAD_TYPE } from './defs';
import { threadId } from '../utils/thread';

export function connectActorToWorker<A extends Actor, W extends Worker | SharedWorker>(
    _actor: A | EnvelopeTransmitterWithMapper<A>,
    _worker: W | EnvelopeTransmitterWithMapper<W>,
) {
    const worker = getEnvelopeTransmitter(_worker);
    const mapper = getTransmitterMapper(_worker);
    const workerPort = getWorkerMessagePort(worker);
    const dispatchToWorker = createDispatch(workerPort);
    const disconnectTransmitters = connectActorToMessagePort(_actor, { transmitter: workerPort, map: mapper });

    dispatchToWorker(createEnvelope(CONNECT_THREAD_TYPE, threadId));

    return () => {
        disconnectTransmitters();
        dispatchToWorker(createEnvelope(DISCONNECT_THREAD_TYPE, threadId));
    };
}

export function connectWorkerToActor<A extends Actor, W extends Worker | SharedWorker>(
    worker: W | EnvelopeTransmitterWithMapper<W>,
    actor: A | EnvelopeTransmitterWithMapper<A>,
) {
    return connectActorToWorker(actor, worker);
}
