import { Envelope } from '../types';
import { CONNECT_THREAD_TYPE, DISCONNECT_THREAD_TYPE } from './defs';

export type ConnectEnvelope = Envelope<typeof CONNECT_THREAD_TYPE, string>;
export type DisconnectEnvelope = Envelope<typeof DISCONNECT_THREAD_TYPE, string>;
