import { TActor, TActorConstructor, TDispatch, TEnvelope, TMailbox } from './types';
import { createSubscribe } from './subscribe';

export function createActorFactory(props: { getMailbox: <T extends TEnvelope<any, any>>() => TMailbox<T> }) {
    return function createActor<In extends TEnvelope<any, any>, Out extends TEnvelope<any, any>>(
        name: string,
        constructor: TActorConstructor<In, Out>,
    ): TActor<In, Out> {
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
                dispatch: mailboxOut.dispatch.bind(mailboxOut) as TDispatch<Out>,
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

            dispatch: mailboxIn.dispatch.bind(mailboxIn) as TDispatch<In>,
            subscribe: createSubscribe(mailboxOut),
        };

        return actor;
    };
}
