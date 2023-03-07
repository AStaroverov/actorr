import { TEnvelope } from '../../src/types';

export const LAUNCH_TYPE = '__LAUNCH__' as const;
export type TLaunchEnvelope = TEnvelope<typeof LAUNCH_TYPE, undefined>;
