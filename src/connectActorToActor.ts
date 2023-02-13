import type {TActor, TAnyEnvelope, TLikeActor} from "./types";
import type {TSourceWithMapper} from "./utils/types";
import {connectSources} from "./utils/connectSources";

export function connectActorToActor
<A extends TLikeActor, B extends TLikeActor>
(_actor1: A | TSourceWithMapper<A>, _actor2: B | TSourceWithMapper<B>) {
    return connectSources(_actor1, _actor2);
}
