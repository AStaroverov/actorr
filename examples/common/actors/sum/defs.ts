import {TEnvelope} from "../../../../src/types";

export type TSumActionEnvelope = TEnvelope<typeof SUM_ACTION_TYPE, [number, number]>
export type TSumResultEnvelope = TEnvelope<typeof SUM_RESULT_TYPE, number>
export const SUM_ACTION_TYPE = 'SUM_ACTION' as const;
export const SUM_RESULT_TYPE = 'SUM_RESULT' as const;
