import {TActor, TEnvelope, TReaction, TMailbox} from "./types";

export function createActorFactory(props: { getMailbox: <T extends TEnvelope<any, any>>() => TMailbox<T> }) {
    return function createActor
    <In extends TEnvelope<any, any>, Out extends TEnvelope<any, any>>
    (name: string, reaction: TReaction<In, Out>): TActor<In, Out> {
        const mailboxIn = props.getMailbox<In>();
        const mailboxOut = props.getMailbox<Out>();

        // @ts-ignore
        if (mailboxIn === mailboxOut) {
            throw new Error('getMailbox should return different instances');
        }

        const context = { dispatch: mailboxOut.dispatch.bind(mailboxOut), mailbox: mailboxIn };
        const subscriber = (envelope: In) => reaction(envelope, context);
        const destroy = () => mailboxIn.unsubscribe(subscriber);

        mailboxIn.subscribe(subscriber);

        return {
            name,
            destroy,

            dispatch: mailboxIn.dispatch.bind(mailboxIn),
            subscribe: mailboxOut.subscribe.bind(mailboxOut),
            unsubscribe: mailboxOut.unsubscribe.bind(mailboxOut),
        };
    }
}
