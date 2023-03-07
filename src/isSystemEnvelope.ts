import type { TAnyEnvelope, TSystemEnvelope } from './types';
import { HEARTBEAT_ENVELOPE } from './heartbeat/def';
import { CHANNEL_CLOSE_TYPE, CHANNEL_OPEN_TYPE } from './channel/defs';
import { CONNECT_MESSAGE_PORT_TYPE, DISCONNECT_MESSAGE_PORT_TYPE } from './worker/defs';

export function isSystemEnvelope(envelope: TAnyEnvelope): envelope is TSystemEnvelope {
    return (
        envelope.type === CONNECT_MESSAGE_PORT_TYPE ||
        envelope.type === DISCONNECT_MESSAGE_PORT_TYPE ||
        envelope.type === CHANNEL_OPEN_TYPE ||
        envelope.type === CHANNEL_CLOSE_TYPE ||
        envelope.type === HEARTBEAT_ENVELOPE
    );
}
