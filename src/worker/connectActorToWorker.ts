import { Actor, AnyEnvelope, EnvelopeTransmitterWithMapper } from '../types';
import { createEnvelope } from '../envelope';
import { CONNECT_MESSAGE_PORT_TYPE, DISCONNECT_MESSAGE_PORT_TYPE } from './defs';
import { connectActorToMessagePort } from './connectActorToMessagePort';
import { getMessagePortName, getMapper, getEnvelopeTransmitter } from '../utils';

export function connectActorToWorker<A extends Actor, W extends Worker | SharedWorker>(
    _actor: A | EnvelopeTransmitterWithMapper<A>,
    _worker: W | EnvelopeTransmitterWithMapper<W>,
) {
    const actor = getEnvelopeTransmitter(_actor);
    const worker = getEnvelopeTransmitter(_worker);
    const mapper = getMapper(_worker);

    const channel = new MessageChannel();
    const localPort = channel.port1;
    const workerPort = channel.port2;
    const workerPortName = getMessagePortName(actor.name);

    const dispatchToWorker =
        worker instanceof SharedWorker ? worker.port.postMessage.bind(worker.port) : worker.postMessage.bind(worker);

    const disconnect = connectActorToMessagePort(_actor, { ref: localPort, map: mapper });

    localPort.start();
    dispatchToWorker(createEnvelope(CONNECT_MESSAGE_PORT_TYPE, workerPortName), [workerPort]);

    return () => {
        disconnect();
        dispatchToWorker(createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, workerPortName));
        localPort.close();
    };
}

export function connectWorkerToActor<A extends Actor, W extends Worker | SharedWorker>(
    worker: W | EnvelopeTransmitterWithMapper<W>,
    actor: A | EnvelopeTransmitterWithMapper<A>,
) {
    return connectActorToWorker(actor, worker);
}
