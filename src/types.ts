import {TChannelCloseEnvelope, TChannelOpenEnvelope} from "./channel/defs";
import {THeartbeatEnvelope} from "./heartbeat/def";
import {TMessagePortName} from "./worker/types";

export type TMailbox<T extends TAnyEnvelope = TAnyEnvelope> = {
    destroy?: () => void;
    dispatch: (envelope: T) => unknown;
    subscribe: (callback: TSubscribeCallback<T>) => Function;
}

export type TEnvelope<T extends string, P> = {
    type: T,
    payload: P,
    transferable: undefined | Transferable[],

    routePassed: undefined | string;
    routeAnnounced: undefined | string;
}

export type TAnyEnvelope = TEnvelope<any, any>;
export type TSystemEnvelope = TChannelOpenEnvelope | TChannelCloseEnvelope | THeartbeatEnvelope;

export type TEnvelopeFilter<T extends TAnyEnvelope, R extends T = T> = (envelope: T) => envelope is R;

export type TDispatch<T extends TAnyEnvelope> = (envelope: T | TSystemEnvelope) => unknown;
export type TSubscribe<T extends TAnyEnvelope> =
    <F extends false|true|void = false>(
        callback: TSubscribeCallback<F extends true ? T | TSystemEnvelope : T>,
        withSystemEnvelopes?: F
    ) => Function;
export type TSubscribeCallback<T extends TAnyEnvelope> = (envelope: T) => unknown;


export type TWithDispatch<T extends TAnyEnvelope> = {
    dispatch: TDispatch<T>;
}

export type TWithSubscribe<T extends TAnyEnvelope> = {
    subscribe: TSubscribe<T>,
}

export type TActorContext<In extends TAnyEnvelope, Out extends TAnyEnvelope> =
    TWithDispatch<Out> & TWithSubscribe<In> & {
        name: string;
    }

export type TActorConstructor<In extends TAnyEnvelope, Out extends TAnyEnvelope> =
    (context: TActorContext<In, Out>) => unknown | Function;

export type TActor<In extends TAnyEnvelope = TAnyEnvelope, Out extends TAnyEnvelope = TAnyEnvelope> =
    TWithDispatch<In> & TWithSubscribe<Out> & {
        name: string;
        launch: () => TActor<In, Out>;
        destroy: () => void;
    };

export type TLikeActor<In extends TAnyEnvelope = TAnyEnvelope, Out extends TAnyEnvelope = TAnyEnvelope> =
    Pick<TActor<In, Out>, 'name' | 'dispatch' | 'subscribe'>;

export type TEnvelopeTransmitter<In extends TAnyEnvelope = TAnyEnvelope, Out extends TAnyEnvelope = TAnyEnvelope> =
    TLikeActor<In, Out> | MessagePort | TMessagePortName

export type TEnvelopeDispatchTarget<T extends TAnyEnvelope = TAnyEnvelope> =
    Pick<TMailbox<T>, 'dispatch'> | TWithDispatch<T> | MessagePort | TMessagePortName

export type TEnvelopeSubscribeSource<T extends TAnyEnvelope = TAnyEnvelope> =
    Pick<TMailbox<T>, 'subscribe'> | TWithSubscribe<T> | MessagePort | TMessagePortName

export type TEnvelopeTransmitterWithMapper<T> = {
    ref: T,
    map?: ((envelope: TAnyEnvelope) => undefined | TAnyEnvelope)
}