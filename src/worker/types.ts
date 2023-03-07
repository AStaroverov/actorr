import { TEnvelope } from '../types';
import { CONNECT_MESSAGE_PORT_TYPE, DISCONNECT_MESSAGE_PORT_TYPE } from './defs';

export type TMessagePortName = string;
export type TConnectEnvelope = TEnvelope<typeof CONNECT_MESSAGE_PORT_TYPE, string>;
export type TDisconnectEnvelope = TEnvelope<typeof DISCONNECT_MESSAGE_PORT_TYPE, string>;
