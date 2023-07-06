import type { AnyEnvelope, SystemEnvelope } from './types';
import { HEARTBEAT_ENVELOPE } from './heartbeat/def';
import { CHANNEL_CLOSE_TYPE, CHANNEL_HANDSHAKE_TYPE } from './channel/defs';
import { CONNECT_THREAD_TYPE, DISCONNECT_THREAD_TYPE } from './worker/defs';

export function isSystemEnvelope(envelope: AnyEnvelope): envelope is SystemEnvelope {
    return (
        envelope.type === CONNECT_THREAD_TYPE ||
        envelope.type === DISCONNECT_THREAD_TYPE ||
        envelope.type === CHANNEL_HANDSHAKE_TYPE ||
        envelope.type === CHANNEL_CLOSE_TYPE ||
        envelope.type === HEARTBEAT_ENVELOPE
    );
}
