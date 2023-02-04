import type {TActor} from "../types";
import type {TMessagePortName} from "../worker/types";
import {TAnyEnvelope} from "../types";

export type TSource = TActor<TAnyEnvelope, TAnyEnvelope> | MessagePort | TMessagePortName;
export type TSourceWithMapper<S> = {
    source: S,
    map?: ((envelope: TAnyEnvelope) => undefined | TAnyEnvelope)
}
export type TListener = (envelope: TAnyEnvelope) => unknown;
