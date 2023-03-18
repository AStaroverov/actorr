import { AnyEnvelope, WithDispatch, WithSubscribe } from '../types';

export type OpenChanelContext<In extends AnyEnvelope, Out extends AnyEnvelope> = WithSubscribe<In> &
    WithDispatch<Out> & { close: Function };
export type SupportChanelContext<In extends AnyEnvelope, Out extends AnyEnvelope> = WithSubscribe<In> &
    WithDispatch<Out>;
