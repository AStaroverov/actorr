import { Envelope } from '../../../../src/types';

export type TMultiplyActionEnvelope = Envelope<typeof MULTIPLY_ACTION_TYPE, number[]>;
export type TMultiplyResultEnvelope = Envelope<typeof MULTIPLY_RESULT_TYPE, number>;
export const MULTIPLY_ACTION_TYPE = 'MULTIPLY_ACTION' as const;
export const MULTIPLY_RESULT_TYPE = 'MULTIPLY_RESULT' as const;
