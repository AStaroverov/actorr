import { ChannelCloseEnvelope, ChannelOpenEnvelope } from './channel/defs';
import { HeartbeatEnvelope } from './heartbeat/def';
import { MessagePortName } from './worker/types';

export type Mailbox<T extends AnyEnvelope = AnyEnvelope> = {
    destroy?: () => void;
    dispatch: (envelope: T) => unknown;
    subscribe: (callback: SubscribeCallback<T>) => Function;
};

export type Envelope<T extends string, P> = {
    type: T;
    payload: P;
    transferable: undefined | Transferable[];

    routePassed: undefined | string;
    routeAnnounced: undefined | string;
};

export type AnyEnvelope = Envelope<any, any>;
export type UnknownEnvelope = Envelope<string, unknown>;
export type SystemEnvelope = ChannelOpenEnvelope | ChannelCloseEnvelope | HeartbeatEnvelope;

export type Dispatch<T extends AnyEnvelope> = (envelope: T | SystemEnvelope) => unknown;
export type Subscribe<T extends AnyEnvelope> = <F extends false | true | void = false>(
    callback: SubscribeCallback<F extends true ? T | SystemEnvelope : T>,
    withSystemEnvelopes?: F,
) => Function;
export type SubscribeCallback<T extends AnyEnvelope> = (envelope: T) => unknown;

export type WithDispatch<T extends AnyEnvelope> = {
    dispatch: Dispatch<T>;
};

export type WithSubscribe<T extends AnyEnvelope> = {
    subscribe: Subscribe<T>;
};

export type ActorContext<In extends AnyEnvelope, Out extends AnyEnvelope> = WithDispatch<Out> &
    WithSubscribe<In> & {
        name: string;
    };

export type ActorConstructor<In extends AnyEnvelope, Out extends AnyEnvelope> = (
    context: ActorContext<In, Out>,
) => unknown | Function;

export type Actor<In extends AnyEnvelope = AnyEnvelope, Out extends AnyEnvelope = AnyEnvelope> = WithDispatch<In> &
    WithSubscribe<Out> & {
        name: string;
        launch: () => Actor<In, Out>;
        destroy: () => void;
    };

export type LikeActor<In extends AnyEnvelope = AnyEnvelope, Out extends AnyEnvelope = AnyEnvelope> = Pick<
    Actor<In, Out>,
    'name' | 'dispatch' | 'subscribe'
>;

export type EnvelopeTransmitter<In extends AnyEnvelope = AnyEnvelope, Out extends AnyEnvelope = AnyEnvelope> =
    | LikeActor<In, Out>
    | MessagePort
    | MessagePortName;

export type EnvelopeDispatchTarget<T extends AnyEnvelope = AnyEnvelope> =
    | Pick<Mailbox<T>, 'dispatch'>
    | WithDispatch<T>
    | MessagePort
    | MessagePortName;

export type EnvelopeSubscribeSource<T extends AnyEnvelope = AnyEnvelope> =
    | Pick<Mailbox<T>, 'subscribe'>
    | WithSubscribe<T>
    | MessagePort
    | MessagePortName;

export type EnvelopeTransmitterWithMapper<T> = {
    ref: T;
    map?: (envelope: AnyEnvelope) => undefined | AnyEnvelope;
};
