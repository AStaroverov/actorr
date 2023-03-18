import { Envelope } from '../../../../src/types';

export type TSumActionEnvelope = Envelope<typeof SUM_ACTION_TYPE, number[]>;
export type TSumResultEnvelope = Envelope<typeof SUM_RESULT_TYPE, number>;
export const SUM_ACTION_TYPE = 'SUM_ACTION' as const;
export const SUM_RESULT_TYPE = 'SUM_RESULT' as const;
