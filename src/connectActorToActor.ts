import {TActor, TEnvelope, TMailbox} from "./types";

export function connectActorToActor
<A extends TActor<TEnvelope<any, any>>, B extends TActor<TEnvelope<any, any>>>(actor1: A, actor2: B) {
    const transferredEnvelopes = new WeakSet<TEnvelope<any, any>>();
    const messageTransfer1 = createMessageTransfer(transferredEnvelopes, actor2.mailbox);
    const messageTransfer2 = createMessageTransfer(transferredEnvelopes, actor1.mailbox);

    actor1.mailbox.subscribe(messageTransfer1);
    actor2.mailbox.subscribe(messageTransfer2);

    return () => {
        actor1.mailbox.unsubscribe(messageTransfer1);
        actor2.mailbox.unsubscribe(messageTransfer2);
    }
}

function createMessageTransfer(transferredEnvelopes: WeakSet<TEnvelope<any, any>>, mailbox: TMailbox<any>) {
    return function messageTransfer(env: TEnvelope<any, any>) {
        if (!transferredEnvelopes.has(env)) {
            transferredEnvelopes.add(env);
            mailbox.dispatch(env);
        }
    };
}