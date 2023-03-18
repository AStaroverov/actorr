import { Envelope } from '../types';

export const HEARTBEAT_ENVELOPE = `__HEARTBEAT_ENVELOPE__` as const;
export type HeartbeatEnvelope = Envelope<typeof HEARTBEAT_ENVELOPE, undefined>;
