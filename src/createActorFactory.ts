import {TActor, TEnvelope, TReaction, TMailbox, TSystemEnvelope} from "./types";
import {createEnvelope} from "./envelope";
import {DESTROY_TYPE, LAUNCH_TYPE} from "./defs";

export function createActorFactory(props: { getMailbox: () => TMailbox<any> }) {
    return function createActor
    <T extends TEnvelope<any, any>>(name: string, reaction: TReaction<T | TSystemEnvelope>): TActor<T | TSystemEnvelope> {
        const mailbox = props.getMailbox();
        const dispatch = mailbox.dispatch.bind(mailbox)
        const callback = (envelope: T) => {
            reaction(envelope, dispatch);
            return ctx;
        }
        const launch = () => {
            mailbox.subscribe(callback);
            mailbox.dispatch(createEnvelope(LAUNCH_TYPE, undefined))
            return ctx;
        };
        const destroy = () => {
            mailbox.dispatch(createEnvelope(DESTROY_TYPE, undefined))
            mailbox.unsubscribe(callback);
            return ctx;
        };
        const ctx = {
            name,
            mailbox,
            dispatch,
            launch,
            destroy,
        };

        return ctx;
    }
}