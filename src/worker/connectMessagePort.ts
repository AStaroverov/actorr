import {TMessagePortName} from "./types";
import {TActor, TAnyEnvelope} from "../types";
import {TSourceWithMapper} from "../utils/types";
import {connectSources} from "../utils/connectSources";

export function connectActorToMessagePort
<A extends TActor<TAnyEnvelope, TAnyEnvelope>, P extends MessagePort | TMessagePortName>
(actor: A | TSourceWithMapper<A>, port: P | TSourceWithMapper<P>): VoidFunction {
    return connectSources(actor, port)
}

export function connectMessagePortToActor
<A extends TActor<TAnyEnvelope, TAnyEnvelope>, P extends MessagePort | TMessagePortName>
(port: P | TSourceWithMapper<P>, actor: A | TSourceWithMapper<A>): VoidFunction {
    return connectActorToMessagePort(actor, port);
}

