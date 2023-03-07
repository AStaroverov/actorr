import { TEnvelope } from '../../../../src/types';

export type TMinMaxActionEnvelope = TEnvelope<typeof MINMAX_ACTION_TYPE, Float64Array>;
export type TMinMaxResultEnvelope = TEnvelope<typeof MINMAX_RESULT_TYPE, Float64Array>;
export const MINMAX_ACTION_TYPE = 'MIN_MAX_ACTION' as const;
export const MINMAX_RESULT_TYPE = 'MIN_MAX_RESULT' as const;
