import {TEnvelope} from "../types";

export const HEARTBEAT_ENVELOPE = `__HEARTBEAT_ENVELOPE__` as const;
export type THeartbeatEnvelope = TEnvelope<typeof HEARTBEAT_ENVELOPE, number/*time*/>;
