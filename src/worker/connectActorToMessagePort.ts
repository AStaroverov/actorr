import type { Actor, EnvelopeTransmitterWithMapper } from '../types';
import type { MessagePortName } from './types';
import { connectEnvelopeTransmitter } from '../connectEnvelopeTransmitter';

export function connectActorToMessagePort<A extends Actor, P extends MessagePort | MessagePortName>(
    actor: A | EnvelopeTransmitterWithMapper<A>,
    port: P | EnvelopeTransmitterWithMapper<P>,
): Function {
    return connectEnvelopeTransmitter(actor, port);
}

export function connectMessagePortToActor<A extends Actor, P extends MessagePort | MessagePortName>(
    port: P | EnvelopeTransmitterWithMapper<P>,
    actor: A | EnvelopeTransmitterWithMapper<A>,
): Function {
    return connectActorToMessagePort(actor, port);
}
