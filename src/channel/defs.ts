import { Envelope } from '../types';

export type OpenChannelId = string;

// don't use enum, when we use object we can use string for functions as argument, useful for external users
export const ChannelCloseReason = <const>{
    ManualBySupporter: 'ManualBySupporter',
    ManualByOpener: 'ManualByOpener',
    LoseChannel: 'LoseChannel',
    Destroy: 'Destroy',
};

export const CHANNEL_HANDSHAKE_TYPE = '__CHANNEL_HANDSHAKE_TYPE__' as const;
export type ChannelHandshakeEnvelope = Envelope<typeof CHANNEL_HANDSHAKE_TYPE, MessagePort>;

export const CHANNEL_CLOSE_TYPE = '__CHANNEL_CLOSE_TYPE__' as const;
export type ChannelCloseEnvelope = Envelope<typeof CHANNEL_CLOSE_TYPE, OpenChannelId>;
