import { Envelope } from '../types';

export const CHANNEL_OPEN_TYPE = '__CHANNEL_OPEN_TYPE__' as const;
export type ChannelOpenEnvelope = Envelope<typeof CHANNEL_OPEN_TYPE, void>;

export const CHANNEL_CLOSE_TYPE = '__CHANNEL_CLOSE_TYPE__' as const;
export type ChannelCloseEnvelope = Envelope<typeof CHANNEL_CLOSE_TYPE, void>;
