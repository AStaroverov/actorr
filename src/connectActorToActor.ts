import type {TLikeActor, TEnvelopeTransmitterWithMapper} from "./types";
import {connectEnvelopeTransmitter} from "./connectEnvelopeTransmitter";

export function connectActorToActor<A extends TLikeActor, B extends TLikeActor>(
    actor1: A | TEnvelopeTransmitterWithMapper<A>,
    actor2: B | TEnvelopeTransmitterWithMapper<B>
) {
    return connectEnvelopeTransmitter(actor1, actor2);
}
