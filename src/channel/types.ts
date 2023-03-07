import { TAnyEnvelope, TWithDispatch, TWithSubscribe } from '../types';

export type TOpenChanelContext<In extends TAnyEnvelope, Out extends TAnyEnvelope> = TWithSubscribe<In> &
    TWithDispatch<Out> & { close: Function };
export type TSupportChanelContext<In extends TAnyEnvelope, Out extends TAnyEnvelope> = TWithSubscribe<In> &
    TWithDispatch<Out>;
