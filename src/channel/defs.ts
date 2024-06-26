import { Envelope } from '../types';

export type OpenChannelId = string;

// don't use enum, when we use object we can use string for functions as argument, useful for external users
export const ChannelCloseReason = <const>{
    ManualBySupporter: 'ManualBySupporter',
    ManualByOpener: 'ManualByOpener',
    LoseChannel: 'LoseChannel',
};

export const CHANNEL_HANDSHAKE_TYPE = '__CHANNEL_HANDSHAKE_TYPE__' as const;
export type ChannelHandshakeEnvelope = Envelope<typeof CHANNEL_HANDSHAKE_TYPE, OpenChannelId>;
export const CHANNEL_READY_TYPE = '__CHANNEL_READY_TYPE__' as const;
export type ChannelReadyEnvelope = Envelope<typeof CHANNEL_READY_TYPE, undefined>;

export const CHANNEL_CLOSE_TYPE = '__CHANNEL_CLOSE_TYPE__' as const;
export type ChannelCloseEnvelope = Envelope<typeof CHANNEL_CLOSE_TYPE, OpenChannelId>;
