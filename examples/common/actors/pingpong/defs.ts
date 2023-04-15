import { Envelope } from '../../../../src';

export const PING_TYPE = 'PING_TYPE' as const;
export type TPingEnvelope = Envelope<typeof PING_TYPE, number>;
