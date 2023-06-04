import type { AnyEnvelope, SystemEnvelope } from './types';
import { HEARTBEAT_ENVELOPE } from './heartbeat/def';
import { CHANNEL_CLOSE_TYPE, CHANNEL_HANDSHAKE_TYPE } from './channel/defs';
import { CONNECT_MESSAGE_PORT_TYPE, DISCONNECT_MESSAGE_PORT_TYPE } from './worker/defs';

export function isSystemEnvelope(envelope: AnyEnvelope): envelope is SystemEnvelope {
    return (
        envelope.type === CONNECT_MESSAGE_PORT_TYPE ||
        envelope.type === DISCONNECT_MESSAGE_PORT_TYPE ||
        envelope.type === CHANNEL_HANDSHAKE_TYPE ||
        envelope.type === CHANNEL_CLOSE_TYPE ||
        envelope.type === HEARTBEAT_ENVELOPE
    );
}
