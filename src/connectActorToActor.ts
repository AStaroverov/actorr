import type { LikeActor, EnvelopeTransmitterWithMapper } from './types';
import { connectEnvelopeTransmitter } from './connectEnvelopeTransmitter';

export function connectActorToActor<A extends LikeActor, B extends LikeActor>(
    actor1: A | EnvelopeTransmitterWithMapper<A>,
    actor2: B | EnvelopeTransmitterWithMapper<B>,
) {
    return connectEnvelopeTransmitter(actor1, actor2);
}
