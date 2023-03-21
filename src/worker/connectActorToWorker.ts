import { Actor, EnvelopeTransmitterWithMapper } from '../types';
import { createEnvelope } from '../envelope';
import { CONNECT_MESSAGE_PORT_TYPE, DISCONNECT_MESSAGE_PORT_TYPE } from './defs';
import { connectActorToMessagePort } from './connectActorToMessagePort';
import { getMessagePortName, getMapper, getEnvelopeTransmitter } from '../utils';
import { getWorkerPostMessage } from './utils';
import { waitWorker } from './waitWorker';

export async function connectActorToWorker<A extends Actor, W extends Worker | SharedWorker>(
    _actor: A | EnvelopeTransmitterWithMapper<A>,
    _worker: W | EnvelopeTransmitterWithMapper<W>,
) {
    const actor = getEnvelopeTransmitter(_actor);
    const worker = getEnvelopeTransmitter(_worker);
    const mapper = getMapper(_worker);

    await waitWorker(worker);

    const channel = new MessageChannel();
    const localPort = channel.port1;
    const workerPort = channel.port2;
    const workerPortName = getMessagePortName(actor.name);
    const postMessage = getWorkerPostMessage(worker);
    const disconnect = connectActorToMessagePort(_actor, { transmitter: localPort, map: mapper });

    localPort.start();
    postMessage(createEnvelope(CONNECT_MESSAGE_PORT_TYPE, workerPortName), [workerPort]);

    return () => {
        disconnect();
        postMessage(createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, workerPortName));
        localPort.close();
    };
}

export function connectWorkerToActor<A extends Actor, W extends Worker | SharedWorker>(
    worker: W | EnvelopeTransmitterWithMapper<W>,
    actor: A | EnvelopeTransmitterWithMapper<A>,
) {
    return connectActorToWorker(actor, worker);
}
