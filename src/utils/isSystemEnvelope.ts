import {CHANNEL_CLOSE_TYPE, CHANNEL_OPEN_TYPE} from "../channel/defs";
import {TAnyEnvelope} from "../types";

export function isSystemEnvelope(envelope: TAnyEnvelope): boolean {
    return (
        envelope.type === CHANNEL_OPEN_TYPE
        || envelope.type === CHANNEL_CLOSE_TYPE
    )
}