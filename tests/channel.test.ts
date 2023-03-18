import { describe, expect, it, jest } from '@jest/globals';
import { connectActorToActor, createActorFactory, createEnvelope, AnyEnvelope, Envelope, Actor } from '../src';
import { createMailbox } from '../examples/common/actors/createActor';
import { openChannelFactory } from '../src/channel/openChannelFactory';
import { OpenChanelContext, SupportChanelContext } from '../src/channel/types';
import { supportChannelFactory } from '../src/channel/supportChannelFactory';
import { Mock } from 'jest-mock';
import { createHeartbeat } from '../src/heartbeat';

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

            setTimeout(() => {
                for (let i = 0; i < 3; i++) {
                    channel.dispatch(createEnvelope(CHANNEL_TYPE, i));
                }
            });
        });
        const ac1 = createActor<TChannelEnvelope, TOpenEnvelope | TChannelEnvelope>(`A1`, (context) => {
            const openChannel = openChannelFactory(context);
            return openChannel(createEnvelope(OPEN_TYPE, undefined), onOpenChannel);
        });

        const onCloseChannel = jest.fn();
        const onChannelEnvelope2 = jest.fn();
        const onSupportChannel = jest.fn((channel: SupportChanelContext<TOpenEnvelope, TChannelEnvelope>) => {
            const unsub = channel.subscribe(onChannelEnvelope2);

            setTimeout(() => {
                for (let i = 0; i < 4; i++) {
                    channel.dispatch(createEnvelope(CHANNEL_TYPE, i));
                }
            });

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
                    setTimeout(close);
                }
            });
        });

        connectActorToActor(ac1, ac2);

        ac2.launch();
        ac1.launch();

        expect(onOpenChannel.mock.calls).toHaveLength(1);
        expect(onSupportChannel.mock.calls).toHaveLength(1);

        setTimeout(() => {
            expect(onChannelEnvelope1.mock.calls).toHaveLength(4);
            expect(onChannelEnvelope2.mock.calls).toHaveLength(3);
            expect(onCloseChannel.mock.calls).toHaveLength(1);
            done();
        });
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

            setTimeout(() => {
                for (let i = 0; i < 3; i++) {
                    channel.dispatch(createEnvelope(CHANNEL_TYPE, i));
                }
            });
        });

        const onSupportChannel = jest.fn((channel: SupportChanelContext<TOpenEnvelope, TChannelEnvelope>) => {
            channel.subscribe(onChannelEnvelope2);

            setTimeout(() => {
                for (let i = 0; i < 4; i++) {
                    channel.dispatch(createEnvelope(CHANNEL_TYPE, i));
                }
            });
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
            done();
        });
    });

    it(`multiple channels`, (done) => {
        const onCloseChannels: Mock[] = [];
        const onChannelEnvelopesFromOpen: Mock[] = [];
        const onChannelEnvelopesFromSupport: Mock[] = [];

        const onOpenChannel = jest.fn((channel: OpenChanelContext<TChannelEnvelope, TChannelEnvelope>) => {
            const onChannelEnvelope = jest.fn();

            onChannelEnvelopesFromOpen.push(onChannelEnvelope);

            channel.subscribe(onChannelEnvelope);

            setTimeout(() => {
                const uniq = Math.random();

                for (let i = 0; i < 3; i++) {
                    channel.dispatch(createEnvelope(CHANNEL_TYPE, uniq));
                }
            });
        });
        const ac1 = createActor<TChannelEnvelope, TOpenEnvelope | TChannelEnvelope>(`A1`, (context) => {
            const openChannel = openChannelFactory(context);
            return openChannel(createEnvelope(OPEN_TYPE, undefined), onOpenChannel);
        });

        const onSupportChannel = jest.fn((channel: SupportChanelContext<TOpenEnvelope, TChannelEnvelope>) => {
            const onChannelEnvelope = jest.fn();

            onChannelEnvelopesFromSupport.push(onChannelEnvelope);

            const unsub = channel.subscribe(onChannelEnvelope);

            setTimeout(() => {
                const uniq = Math.random();

                for (let i = 0; i < 4; i++) {
                    channel.dispatch(createEnvelope(CHANNEL_TYPE, uniq));
                }
            });

            const onCloseChannel = jest.fn(() => unsub());
            onCloseChannels.push(onCloseChannel);

            return onCloseChannel;
        });
        const createOtherActor = () =>
            createActor<TOpenEnvelope | TChannelEnvelope, TChannelEnvelope>(`OTHER`, (context) => {
                const supportChannel = supportChannelFactory(context);

                return context.subscribe((envelope) => {
                    if (envelope.type === OPEN_TYPE) {
                        const close = supportChannel(envelope, onSupportChannel);
                        setTimeout(close);
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
        });
    });

    it(`close channel on heartbeat timeout`, (done) => {
        const onHeartbeatTimeout = jest.fn((timeout: number) => {});
        const closeSupportedChannel = jest.fn(() => {});

        const onOpenChannel = jest.fn((channel: OpenChanelContext<TChannelEnvelope, TChannelEnvelope>) => {
            const stop = createHeartbeat(
                channel,
                (timeout) => {
                    stop();
                    channel.close();
                    onHeartbeatTimeout(timeout);
                },
                {
                    maxTimeout: 1000,
                    checkTimeout: 100,
                    dispatchTimeout: 300,
                },
            );

            return stop;
        });

        const onSupportChannel = jest.fn((channel: SupportChanelContext<TOpenEnvelope, TChannelEnvelope>) => {
            return closeSupportedChannel;
        });

        const ac1 = createActor<TChannelEnvelope, TOpenEnvelope | TChannelEnvelope>(`A1`, (context) => {
            const openChannel = openChannelFactory(context);
            return openChannel(createEnvelope(OPEN_TYPE, undefined), onOpenChannel);
        });

        const ac2 = createActor<TOpenEnvelope | TChannelEnvelope, TChannelEnvelope>(`A2`, (context) => {
            const supportChannel = supportChannelFactory(context);
            return context.subscribe((envelope) => {
                if (envelope.type === OPEN_TYPE) {
                    supportChannel(envelope, onSupportChannel);
                }
            });
        });

        connectActorToActor(ac1, ac2);

        ac2.launch();
        ac1.launch();

        setTimeout(() => {
            expect(onHeartbeatTimeout.mock.calls).toHaveLength(1);
            expect(onHeartbeatTimeout.mock.calls[0][0]).toBeGreaterThan(1000);
            expect(closeSupportedChannel.mock.calls).toHaveLength(1);
            done();
        }, 1100);
    });
});
