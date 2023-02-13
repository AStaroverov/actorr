import type {TActor, TLikeActor} from "../types";
import type {TMessagePortName} from "../worker/types";
import {TAnyEnvelope} from "../types";

export type TSource = TLikeActor | MessagePort | TMessagePortName;
export type TSourceWithMapper<S> = {
    source: S,
    map?: ((envelope: TAnyEnvelope) => undefined | TAnyEnvelope)
}
export type TListener = (envelope: TAnyEnvelope) => unknown;
