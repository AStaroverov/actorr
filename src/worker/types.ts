import { Envelope } from '../types';
import { CONNECT_MESSAGE_PORT_TYPE, DISCONNECT_MESSAGE_PORT_TYPE } from './defs';

export type ConnectEnvelope = Envelope<typeof CONNECT_MESSAGE_PORT_TYPE, string>;
export type DisconnectEnvelope = Envelope<typeof DISCONNECT_MESSAGE_PORT_TYPE, string>;
