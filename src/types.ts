export type TEnvelope<T extends string, P> = {
    type: T,
    payload: P,
    transferable: undefined | Transferable[],

    routePassed: undefined | string;
    routeAnnounced: undefined | string;
}

export type TAnyEnvelope = TEnvelope<any, any>;

export type TMailbox<T extends TEnvelope<any, any>> = {
    destroy?(): void;
    dispatch(envelope: T): void;
    subscribe(callback: (envelope: T) => unknown): void;
    unsubscribe(callback: (envelope: T) => unknown): void;
}

export type TReaction<In extends TEnvelope<any, any>, Out extends TEnvelope<any, any>> =
    (envelope: In, context: { mailbox: TMailbox<In>, dispatch: (envelope: Out) => void }) => unknown;

export type TActor<In extends TEnvelope<any, any>, Out extends TEnvelope<any, any>> = {
    name: string;
    destroy: () => void;

    dispatch(envelope: In): void;
    subscribe(callback: (envelope: Out) => unknown): void;
    unsubscribe(callback: (envelope: Out) => unknown): void;
};
