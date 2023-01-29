import {DESTROY_TYPE, LAUNCH_TYPE} from "./defs";

export type TEnvelope<T extends string, P> = {
    type: T,
    payload: P,
    transferable?: undefined | Transferable[],
}
export type TLaunchEnvelope = TEnvelope<typeof LAUNCH_TYPE, string>;
export type TDestroyEnvelope = TEnvelope<typeof DESTROY_TYPE, string>;
export type TSystemEnvelope = TLaunchEnvelope | TDestroyEnvelope;

export type TMailbox<T extends TEnvelope<any, any>> = {
    destroy?(): void;
    dispatch(envelope: T): void;
    subscribe(callback: (envelope: T) => unknown): void;
    unsubscribe(callback: (envelope: T) => unknown): void;
}

export type TReaction<T extends TEnvelope<any, any>> = (envelope:T, dispatch: (envelope:T) => void) => unknown;

export type TActor<T extends TEnvelope<any, any>> = {
    name: string;
    mailbox: TMailbox<T>;
    dispatch: (envelope:T) => void;

    launch: () => TActor<T>;
    destroy: () => TActor<T>;
};

