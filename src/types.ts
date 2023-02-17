import {TChannelCloseEnvelope, TChannelOpenEnvelope} from "./channel/defs";

export type TEnvelope<T extends string, P> = {
    type: T,
    payload: P,
    transferable: undefined | Transferable[],

    routePassed: undefined | string;
    routeAnnounced: undefined | string;
}

export type TAnyEnvelope = TEnvelope<any, any>;
export type TSystemEnvelope = TChannelOpenEnvelope | TChannelCloseEnvelope;

export type TDispatcher<T extends TAnyEnvelope> = (envelope: T | TSystemEnvelope) => unknown;
export type TSubscriber<T extends TAnyEnvelope> = (callback: TSubscribeCallback<T>) => void;
export type TUnsubscriber<T extends TAnyEnvelope> = (callback: TSubscribeCallback<T>) => void;
export type TSubscribeCallback<T extends TAnyEnvelope> = (envelope: T) => unknown;

export type TMailbox<T extends TAnyEnvelope> = {
    destroy?: () => void;
    dispatch: TDispatcher<T>;
    subscribe: TSubscriber<T>;
    unsubscribe: TUnsubscriber<T>;
}

export type TActorContext<In extends TAnyEnvelope, Out extends TAnyEnvelope> = {
    name: string;
    dispatch: TMailbox<Out>["dispatch"],
    subscribe: TMailbox<In>["subscribe"],
    unsubscribe: TMailbox<In>["unsubscribe"],
}

export type TActorConstructor<In extends TAnyEnvelope, Out extends TAnyEnvelope> =
    (context: TActorContext<In, Out>) => unknown | Function;

export type TActor<In extends TAnyEnvelope, Out extends TAnyEnvelope> = {
    name: string;
    launch: () => TActor<In, Out>;
    destroy: () => void;

    dispatch: (envelope: In) => void;
    subscribe: (callback: (envelope: Out) => unknown) => void;
    unsubscribe: (callback: (envelope: Out) => unknown) => void;
};

export type TWithDispatch<T extends TAnyEnvelope = TAnyEnvelope> = {
    dispatch: TDispatcher<T>;
}

export type TWithSubscribe<T extends TAnyEnvelope = TAnyEnvelope> = {
    subscribe: TSubscriber<T>,
    unsubscribe: TUnsubscriber<T>,
}

export type TLikeActor<In extends TAnyEnvelope = TAnyEnvelope, Out extends TAnyEnvelope = TAnyEnvelope> =
    Pick<TActor<In, Out>, 'name' | 'dispatch' | 'subscribe' | 'unsubscribe'>;