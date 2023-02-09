import {TActor, TActorConstructor, TEnvelope, TMailbox} from "./types";

export function createActorFactory(props: { getMailbox: <T extends TEnvelope<any, any>>() => TMailbox<T> }) {
    return function createActor
    <In extends TEnvelope<any, any>, Out extends TEnvelope<any, any>>
    (name: string, constructor: TActorConstructor<In, Out>): TActor<In, Out> {
        const mailboxIn = props.getMailbox<In>();
        const mailboxOut = props.getMailbox<Out>();

        // @ts-ignore
        if (mailboxIn === mailboxOut) {
            throw new Error('getMailbox should return different instances');
        }

        let dispose: unknown | Function;

        const launch = () => {
            dispose = constructor({
                dispatch: mailboxOut.dispatch.bind(mailboxOut),
                subscribe: mailboxIn.subscribe.bind(mailboxIn),
                unsubscribe: mailboxIn.unsubscribe.bind(mailboxIn)
            });
            return actor;
        }

        const destroy = () => {
            mailboxIn.destroy?.();
            mailboxOut.destroy?.();
            typeof dispose === 'function' && dispose();
        }

        const actor = {
            name,
            launch,
            destroy,

            dispatch: mailboxIn.dispatch.bind(mailboxIn),
            subscribe: mailboxOut.subscribe.bind(mailboxOut),
            unsubscribe: mailboxOut.unsubscribe.bind(mailboxOut),
        }

        return actor;
    }
}
