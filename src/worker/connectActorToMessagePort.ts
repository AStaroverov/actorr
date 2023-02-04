import {TMessagePortName} from "./types";
import {TActor, TAnyEnvelope} from "../types";
import {TSourceWithMapper} from "../utils/types";
import {connectSources} from "../utils/connectSources";

export function connectActorToMessagePort
<A extends TActor<TAnyEnvelope, TAnyEnvelope>, P extends MessagePort | TMessagePortName>
(actor: A | TSourceWithMapper<A>, port: P | TSourceWithMapper<P>) {
    return connectSources(actor, port)
}
