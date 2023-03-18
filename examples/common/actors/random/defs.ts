import { Envelope } from '../../../../src/types';

export const GENERATE_RANDOM_TYPE = 'GENERATE_RANDOM_TYPE' as const;
export type TGenerateRandomEnvelope = Envelope<typeof GENERATE_RANDOM_TYPE, undefined>;

export const NEXT_RANDOM_TYPE = 'NEXT_RANDOM_TYPE' as const;
export type TNextRandomEnvelope = Envelope<typeof NEXT_RANDOM_TYPE, number>;
