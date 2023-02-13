export type TEnvelope<T extends string, P> = {
    type: T,
    payload: P,
    transferable: undefined | Transferable[],

    routePassed: undefined | string;
    routeAnnounced: undefined | string;
}

export type TAnyEnvelope = TEnvelope<any, any>;

export type TSubscriber<T extends TAnyEnvelope> = (envelope: T) => unknown;
export type TDispatcher<T extends TAnyEnvelope> = (envelope: T) => unknown;

export type TMailbox<T extends TAnyEnvelope> = {
    destroy?: () => void;
    dispatch: TDispatcher<T>;
    subscribe: (callback: TSubscriber<T>) => void;
    unsubscribe: (callback: TSubscriber<T>) => void;
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

export type TLikeActor = Pick<TActor<TAnyEnvelope, TAnyEnvelope>, 'name' | 'dispatch' | 'subscribe' | 'unsubscribe'>;