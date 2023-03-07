import { TEnvelope } from '../types';

export const CHANNEL_OPEN_TYPE = '__CHANNEL_OPEN_TYPE__' as const;
export type TChannelOpenEnvelope = TEnvelope<typeof CHANNEL_OPEN_TYPE, void>;

export const CHANNEL_CLOSE_TYPE = '__CHANNEL_CLOSE_TYPE__' as const;
export type TChannelCloseEnvelope = TEnvelope<typeof CHANNEL_CLOSE_TYPE, void>;
