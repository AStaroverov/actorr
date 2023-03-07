import type { TActor, TEnvelopeTransmitterWithMapper } from '../types';
import type { TMessagePortName } from './types';
import { connectEnvelopeTransmitter } from '../connectEnvelopeTransmitter';

export function connectActorToMessagePort<A extends TActor, P extends MessagePort | TMessagePortName>(
    actor: A | TEnvelopeTransmitterWithMapper<A>,
    port: P | TEnvelopeTransmitterWithMapper<P>,
): Function {
    return connectEnvelopeTransmitter(actor, port);
}

export function connectMessagePortToActor<A extends TActor, P extends MessagePort | TMessagePortName>(
    port: P | TEnvelopeTransmitterWithMapper<P>,
    actor: A | TEnvelopeTransmitterWithMapper<A>,
): Function {
    return connectActorToMessagePort(actor, port);
}
