import type {TActor, TEnvelope, TMailbox} from "../types";
import type {TMessagePortName} from "../worker/types";

export type TSource = TMailbox<any> | TActor<any> | MessagePort | TMessagePortName;
export type TSourceWithMapper<S> = {
    source: S,
    map?: ((envelope: TEnvelope<any, any>) => undefined | TEnvelope<any, any>)
}
export type TListener = (envelope: TEnvelope<any, any>) => unknown;
