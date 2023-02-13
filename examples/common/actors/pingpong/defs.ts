import {TEnvelope} from "../../../../src/types";

export const OPEN_CHANNEL_TYPE = 'OPEN_CHANNEL_TYPE' as const;
export type TOpenChannelEnvelope = TEnvelope<typeof OPEN_CHANNEL_TYPE, number>;

export const PING_TYPE = 'PING_TYPE' as const;
export type TPingEnvelope = TEnvelope<typeof PING_TYPE, number>;

export const PONG_TYPE = 'PONG_TYPE' as const;
export type TPongEnvelope = TEnvelope<typeof PONG_TYPE, number>;

