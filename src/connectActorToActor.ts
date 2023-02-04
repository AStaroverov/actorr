import type {TActor, TAnyEnvelope} from "./types";
import type {TSourceWithMapper} from "./utils/types";
import {connectSources} from "./utils/connectSources";

export function connectActorToActor
<A extends TActor<TAnyEnvelope, TAnyEnvelope>, B extends TActor<TAnyEnvelope, TAnyEnvelope>>
(_actor1: A | TSourceWithMapper<A>, _actor2: B | TSourceWithMapper<B>) {
    return connectSources(_actor1, _actor2);
}
