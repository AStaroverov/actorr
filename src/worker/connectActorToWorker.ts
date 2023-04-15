import { Actor, EnvelopeTransmitterWithMapper } from '../types';
import { createEnvelope } from '../envelope';
import { CONNECT_MESSAGE_PORT_TYPE, DISCONNECT_MESSAGE_PORT_TYPE } from './defs';
import { connectActorToMessagePort } from './connectActorToMessagePort';
import { createMessagePortName, getEnvelopeTransmitter, getTransmitterMapper, setPortName } from '../utils';
import { getWorkerMessagePort } from './utils';
import { createDispatch } from '../dispatch';

export function connectActorToWorker<A extends Actor, W extends Worker | SharedWorker>(
    _actor: A | EnvelopeTransmitterWithMapper<A>,
    _worker: W | EnvelopeTransmitterWithMapper<W>,
) {
    const actor = getEnvelopeTransmitter(_actor);
    const worker = getEnvelopeTransmitter(_worker);
    const mapper = getTransmitterMapper(_worker);

    const channel = new MessageChannel();
    const localPort = channel.port1;
    const workerPort = channel.port2;
    const localPortName = createMessagePortName(`local|${actor.name}`);
    const workerPortName = createMessagePortName(`worker|${actor.name}`);

    localPort.start();
    setPortName(localPort, localPortName);

    const dispatchToWorker = createDispatch(getWorkerMessagePort(worker));
    const disconnectTransmitters = connectActorToMessagePort(_actor, { transmitter: localPort, map: mapper });

    dispatchToWorker(createEnvelope(CONNECT_MESSAGE_PORT_TYPE, workerPortName, [workerPort]));

    return () => {
        disconnectTransmitters();
        dispatchToWorker(createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, workerPortName));
        localPort.close();
        workerPort.close();
    };
}

export function connectWorkerToActor<A extends Actor, W extends Worker | SharedWorker>(
    worker: W | EnvelopeTransmitterWithMapper<W>,
    actor: A | EnvelopeTransmitterWithMapper<A>,
) {
    return connectActorToWorker(actor, worker);
}
