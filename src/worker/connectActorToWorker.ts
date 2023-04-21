import { Actor, EnvelopeTransmitterWithMapper } from '../types';
import { createEnvelope } from '../envelope';
import { connectActorToMessagePort } from './connectActorToMessagePort';
import { createMessagePortName, getEnvelopeTransmitter, getTransmitterMapper } from '../utils';
import { getWorkerMessagePort } from './utils';
import { createDispatch } from '../dispatch';
import { CONNECT_MESSAGE_PORT_TYPE, DISCONNECT_MESSAGE_PORT_TYPE } from './defs';
import { threadName } from '../locks';

export function connectActorToWorker<A extends Actor, W extends Worker | SharedWorker>(
    _actor: A | EnvelopeTransmitterWithMapper<A>,
    _worker: W | EnvelopeTransmitterWithMapper<W>,
) {
    const worker = getEnvelopeTransmitter(_worker);
    const mapper = getTransmitterMapper(_worker);
    const workerPort = getWorkerMessagePort(worker);
    const dispatchToWorker = createDispatch(workerPort);
    const disconnectTransmitters = connectActorToMessagePort(_actor, { transmitter: workerPort, map: mapper });

    dispatchToWorker(createEnvelope(CONNECT_MESSAGE_PORT_TYPE, createMessagePortName(threadName)));

    return () => {
        disconnectTransmitters();
        dispatchToWorker(createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, createMessagePortName(threadName)));
    };
}

export function connectWorkerToActor<A extends Actor, W extends Worker | SharedWorker>(
    worker: W | EnvelopeTransmitterWithMapper<W>,
    actor: A | EnvelopeTransmitterWithMapper<A>,
) {
    return connectActorToWorker(actor, worker);
}
