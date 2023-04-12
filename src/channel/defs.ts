import { Envelope } from '../types';

export const ChannelCloseReason = <const>{
    Manual: 'Manual',
    Destroy: 'Destroy',
    LoseChannel: 'LoseChannel',
};

export const CHANNEL_OPEN_TYPE = '__CHANNEL_OPEN_TYPE__' as const;
export type ChannelOpenEnvelope = Envelope<typeof CHANNEL_OPEN_TYPE, MessagePort>;

export const CHANNEL_CLOSE_TYPE = '__CHANNEL_CLOSE_TYPE__' as const;
export type ChannelCloseEnvelope = Envelope<typeof CHANNEL_CLOSE_TYPE, void>;
