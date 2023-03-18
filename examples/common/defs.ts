import { Envelope } from '../../src/types';

export const LAUNCH_TYPE = '__LAUNCH__' as const;
export type TLaunchEnvelope = Envelope<typeof LAUNCH_TYPE, undefined>;
