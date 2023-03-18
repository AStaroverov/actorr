import { Actor, ActorConstructor, Dispatch, Envelope, Mailbox } from './types';
import { createSubscribe } from './subscribe';

export function createActorFactory(props: { getMailbox: <T extends Envelope<any, any>>() => Mailbox<T> }) {
    return function createActor<In extends Envelope<any, any>, Out extends Envelope<any, any>>(
        name: string,
        constructor: ActorConstructor<In, Out>,
    ): Actor<In, Out> {
        const mailboxIn = props.getMailbox<In>();
        const mailboxOut = props.getMailbox<Out>();

        // @ts-ignore
        if (mailboxIn === mailboxOut) {
            throw new Error('getMailbox should return different instances');
        }

        let dispose: unknown | Function;

        const launch = () => {
            dispose = constructor({
                name,
                dispatch: mailboxOut.dispatch.bind(mailboxOut) as Dispatch<Out>,
                subscribe: createSubscribe(mailboxIn),
            });
            return actor;
        };

        const destroy = () => {
            mailboxIn.destroy?.();
            mailboxOut.destroy?.();
            typeof dispose === 'function' && dispose();
        };

        const actor = {
            name,
            launch,
            destroy,

            dispatch: mailboxIn.dispatch.bind(mailboxIn) as Dispatch<In>,
            subscribe: createSubscribe(mailboxOut),
        };

        return actor;
    };
}
