import type { EnvelopeTransmitterWithMapper, ActorContext, Actor } from './types';
import { connectEnvelopeTransmitter } from './connectEnvelopeTransmitter';

export function connectActorToActor<A extends Actor | ActorContext, B extends Actor | ActorContext>(
    actor1: A | EnvelopeTransmitterWithMapper<A>,
    actor2: B | EnvelopeTransmitterWithMapper<B>,
) {
    return connectEnvelopeTransmitter(actor1, actor2);
}
