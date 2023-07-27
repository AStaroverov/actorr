import './locks';
import { describe, expect, it, jest } from '@jest/globals';
import {
    AnyEnvelope,
    connectActorToActor,
    createActorFactory,
    createEnvelope,
    Envelope,
    UnknownEnvelope,
} from '../src';
import { createMailbox } from '../examples/common/actors/createActor';

export const NUMBER_TYPE = 'NUMBER_TYPE' as const;
export type TNumberEnvelope = Envelope<typeof NUMBER_TYPE, number>;

export const TRIGGER_TYPE = 'TRIGGER_TYPE' as const;
export type TStartEnvelope = Envelope<typeof TRIGGER_TYPE, undefined>;

describe(`Base`, () => {
    const createActor = createActorFactory({ getMailbox: createMailbox });

    it(`launch + destroy`, () => {
        const dispose = jest.fn();
        const init = jest.fn(() => dispose);
        const actor = createActor<UnknownEnvelope, TNumberEnvelope>(`Actor`, init);

        actor.launch();
        expect(init.mock.calls).toHaveLength(1);

        actor.destroy();
        expect(dispose.mock.calls).toHaveLength(1);
    });

    it(`create chain from 3 actors`, () => {
        const firstEnv = createEnvelope(NUMBER_TYPE, 1);
        const secondEnv = createEnvelope(NUMBER_TYPE, 2);
        const receivedMessages: Array<AnyEnvelope> = [];
        const ac1 = createActor<UnknownEnvelope, TNumberEnvelope>(`A1`, ({ dispatch, subscribe }) => {
            dispatch(firstEnv);
        });

        const ac2 = createActor<TNumberEnvelope, TNumberEnvelope>(`A2`, ({ dispatch, subscribe }) => {
            dispatch(secondEnv);
            subscribe((envelope) => {
                envelope.type === NUMBER_TYPE && receivedMessages.push(envelope);
            });
        });

        const ac3 = createActor<TNumberEnvelope, UnknownEnvelope>(`A3`, ({ dispatch, subscribe }) => {
            subscribe((envelope) => {
                envelope.type === NUMBER_TYPE && receivedMessages.push(envelope);
            });
        });

        connectActorToActor(ac1, ac2);
        connectActorToActor(ac2, ac3);

        ac3.launch();
        ac2.launch();
        ac1.launch();

        expect(receivedMessages[0].payload).toEqual(secondEnv.payload);
        expect(receivedMessages[1].payload).toEqual(firstEnv.payload);
    });

    it(`correct disconnect actors`, () => {
        const firstEnv = createEnvelope(NUMBER_TYPE, 1);
        const receivedMessages: Array<AnyEnvelope> = [];
        const ac1 = createActor<TStartEnvelope, TNumberEnvelope>(`A1`, ({ dispatch, subscribe }) => {
            subscribe((envelope) => {
                envelope.type === TRIGGER_TYPE && dispatch(firstEnv);
            });
        });

        const ac2 = createActor<UnknownEnvelope, TNumberEnvelope>(`A2`, ({ dispatch, subscribe }) => {
            subscribe((envelope) => {
                envelope.type === NUMBER_TYPE && receivedMessages.push(envelope);
            });
        });

        const disconnect = connectActorToActor(ac1, ac2);

        ac1.launch();
        ac2.launch();
        ac1.dispatch(createEnvelope(TRIGGER_TYPE, undefined));

        disconnect();

        ac1.dispatch(createEnvelope(TRIGGER_TYPE, undefined));

        expect(receivedMessages.length).toEqual(1);
    });
});
