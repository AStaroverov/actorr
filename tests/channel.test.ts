import { describe, expect, it, jest } from '@jest/globals';

import type { Actor, AnyEnvelope, Envelope, OpenChanelContext, SupportChanelContext } from '../src';
import {
    connectActorToActor,
    createActorFactory,
    createEnvelope,
    openChannelFactory,
    supportChannelFactory,
} from '../src';
import { createMailbox } from '../examples/common/actors/createActor';
import { Mock } from 'jest-mock';

export const OPEN_TYPE = 'OPEN_TYPE' as const;
export type TOpenEnvelope = Envelope<typeof OPEN_TYPE, undefined>;
export const CHANNEL_TYPE = 'CHANNEL_TYPE' as const;
export type TChannelEnvelope = Envelope<typeof CHANNEL_TYPE, number>;

describe(`Channel`, () => {
    const createActor = createActorFactory({ getMailbox: createMailbox });

    it(`single channel`, (done) => {
        const onChannelEnvelope1 = jest.fn();
        const onOpenChannel = jest.fn((channel: OpenChanelContext<TChannelEnvelope, TChannelEnvelope>) => {
            channel.subscribe(onChannelEnvelope1);

            for (let i = 0; i < 3; i++) {
                channel.dispatch(createEnvelope(CHANNEL_TYPE, i));
            }
        });
        const ac1 = createActor<TChannelEnvelope, TOpenEnvelope | TChannelEnvelope>(`A1`, (context) => {
            const openChannel = openChannelFactory(context);
            return openChannel(createEnvelope(OPEN_TYPE, undefined), onOpenChannel);
        });

        const onCloseChannel = jest.fn();
        const onChannelEnvelope2 = jest.fn();
        const onSupportChannel = jest.fn((channel: SupportChanelContext<TOpenEnvelope, TChannelEnvelope>) => {
            const unsub = channel.subscribe(onChannelEnvelope2);

            for (let i = 0; i < 4; i++) {
                channel.dispatch(createEnvelope(CHANNEL_TYPE, i));
            }

            return () => {
                unsub();
                onCloseChannel();
            };
        });
        const ac2 = createActor<TOpenEnvelope | TChannelEnvelope, TChannelEnvelope>(`A2`, (context) => {
            const supportChannel = supportChannelFactory(context);

            return context.subscribe((envelope) => {
                if (envelope.type === OPEN_TYPE) {
                    const close = supportChannel(envelope, onSupportChannel);
                    setTimeout(close, 10);
                }
            });
        });

        connectActorToActor(ac1, ac2);

        ac2.launch();
        ac1.launch();

        setTimeout(() => {
            expect(onOpenChannel.mock.calls).toHaveLength(1);
            expect(onSupportChannel.mock.calls).toHaveLength(1);
            expect(onChannelEnvelope1.mock.calls).toHaveLength(4);
            expect(onChannelEnvelope2.mock.calls).toHaveLength(3);
            expect(onCloseChannel.mock.calls).toHaveLength(1);
            done();
        }, 20);
    });

    it(`single channel through few actors`, (done) => {
        const createActorWrapper = <T extends Actor>(createInternalActor: () => T) =>
            createActor<AnyEnvelope, AnyEnvelope>(`ActorWrapper`, (context) => {
                const actor = createInternalActor();
                const disconnect = connectActorToActor(context, actor);

                actor.launch();

                return () => {
                    disconnect();
                    actor.destroy();
                };
            });

        const onChannelEnvelope1 = jest.fn();
        const onChannelEnvelope2 = jest.fn();

        const onOpenChannel = jest.fn((channel: OpenChanelContext<TChannelEnvelope, TChannelEnvelope>) => {
            channel.subscribe(onChannelEnvelope1);

            for (let i = 0; i < 3; i++) {
                channel.dispatch(createEnvelope(CHANNEL_TYPE, i));
            }
        });

        const onSupportChannel = jest.fn((channel: SupportChanelContext<TOpenEnvelope, TChannelEnvelope>) => {
            channel.subscribe(onChannelEnvelope2);

            for (let i = 0; i < 4; i++) {
                channel.dispatch(createEnvelope(CHANNEL_TYPE, i));
            }
        });

        const createActorStart = () =>
            createActor<TChannelEnvelope, TOpenEnvelope | TChannelEnvelope>(`ActorStart`, (context) => {
                const openChannel = openChannelFactory(context);
                return openChannel(createEnvelope(OPEN_TYPE, undefined), onOpenChannel);
            });

        const createActorEnd = () =>
            createActor<TOpenEnvelope | TChannelEnvelope, TChannelEnvelope>(`ActorEnd`, (context) => {
                const supportChannel = supportChannelFactory(context);

                return context.subscribe((envelope) => {
                    if (envelope.type === OPEN_TYPE) {
                        supportChannel(envelope, onSupportChannel);
                    }
                });
            });

        const start = createActorStart();
        const wrapper = createActorWrapper(() => createActorWrapper(() => createActorEnd()));

        connectActorToActor(start, wrapper);

        wrapper.launch();
        start.launch();

        expect(onOpenChannel.mock.calls).toHaveLength(1);
        expect(onSupportChannel.mock.calls).toHaveLength(1);

        setTimeout(() => {
            expect(onChannelEnvelope1.mock.calls).toHaveLength(4);
            expect(onChannelEnvelope2.mock.calls).toHaveLength(3);
            start.destroy();
            wrapper.destroy();
            done();
        }, 20);
    });

    it(`multiple channels`, (done) => {
        const onCloseChannels: Mock[] = [];
        const onChannelEnvelopesFromOpen: Mock[] = [];
        const onChannelEnvelopesFromSupport: Mock[] = [];

        const onOpenChannel = jest.fn((channel: OpenChanelContext<TChannelEnvelope, TChannelEnvelope>) => {
            const uniq = Math.random();
            const onChannelEnvelope = jest.fn();

            for (let i = 0; i < 3; i++) {
                channel.dispatch(createEnvelope(CHANNEL_TYPE, uniq));
            }

            channel.subscribe(onChannelEnvelope);
            onChannelEnvelopesFromOpen.push(onChannelEnvelope);
        });
        const ac1 = createActor<TChannelEnvelope, TOpenEnvelope | TChannelEnvelope>(`A1`, (context) => {
            const openChannel = openChannelFactory(context);
            return openChannel(createEnvelope(OPEN_TYPE, undefined), onOpenChannel);
        });

        const onSupportChannel = jest.fn((channel: SupportChanelContext<TOpenEnvelope, TChannelEnvelope>) => {
            const uniq = Math.random();
            const onChannelEnvelope = jest.fn();
            const onCloseChannel = jest.fn(() => unsub());
            const unsub = channel.subscribe(onChannelEnvelope);

            for (let i = 0; i < 4; i++) {
                channel.dispatch(createEnvelope(CHANNEL_TYPE, uniq));
            }

            onCloseChannels.push(onCloseChannel);
            onChannelEnvelopesFromSupport.push(onChannelEnvelope);

            return onCloseChannel;
        });
        const createOtherActor = () =>
            createActor<TOpenEnvelope | TChannelEnvelope, TChannelEnvelope>(`OTHER`, (context) => {
                const supportChannel = supportChannelFactory(context);

                return context.subscribe((envelope) => {
                    if (envelope.type === OPEN_TYPE) {
                        const close = supportChannel(envelope, onSupportChannel);
                        setTimeout(close, 10);
                    }
                });
            });

        const ac2 = createOtherActor();
        const ac3 = createOtherActor();

        connectActorToActor(ac1, ac2);
        connectActorToActor(ac1, ac3);

        ac3.launch();
        ac2.launch();
        ac1.launch();

        expect(onOpenChannel.mock.calls).toHaveLength(2);
        expect(onSupportChannel.mock.calls).toHaveLength(2);

        setTimeout(() => {
            for (const onChannelEnvelope of onChannelEnvelopesFromOpen) {
                const calls = onChannelEnvelope.mock.calls as Array<[TChannelEnvelope]>;

                expect(calls).toHaveLength(4);

                for (let i = 1; i < calls.length; i++) {
                    expect(calls[i][0].payload).toEqual(calls[i - 1][0].payload);
                }
            }

            for (const onChannelEnvelope of onChannelEnvelopesFromSupport) {
                const calls = onChannelEnvelope.mock.calls as Array<[TChannelEnvelope]>;

                expect(calls).toHaveLength(3);

                for (let i = 1; i < calls.length; i++) {
                    expect(calls[i][0].payload).toEqual(calls[i - 1][0].payload);
                }
            }

            for (const onCloseChannel of onCloseChannels) {
                expect(onCloseChannel.mock.calls).toHaveLength(1);
            }

            done();
        }, 20);
    });
});
