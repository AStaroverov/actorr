import { AnyEnvelope, ValueOf, WithDispatch, WithSubscribe } from '../types';
import { ChannelCloseReason } from './defs';

export type OpenChanelContext<In extends AnyEnvelope, Out extends AnyEnvelope> = WithSubscribe<In> &
    WithDispatch<Out> & { close: Function };
export type SupportChanelContext<In extends AnyEnvelope, Out extends AnyEnvelope> = WithSubscribe<In> &
    WithDispatch<Out>;

export type ChannelDispose = (reason: ValueOf<typeof ChannelCloseReason>) => void;
