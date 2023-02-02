import {TMessagePortName} from "./types";
import {TActor, TEnvelope} from "../types";
import {TSourceWithMapper} from "../utils/types";
import {connectSources} from "../utils/connectSources";

export function connectActorToMessagePort
<A extends TActor<TEnvelope<any, any>>, P extends MessagePort | TMessagePortName>
(actor: A | TSourceWithMapper<A>, port: P | TSourceWithMapper<P>) {
    return connectSources(actor, port)
}
