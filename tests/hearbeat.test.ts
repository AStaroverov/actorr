import { describe, expect, it, jest } from '@jest/globals';

import type { Envelope, OpenChanelContext, SupportChanelContext } from '../src';
import {
    connectActorToActor,
    createActorFactory,
    createEnvelope,
    createHeartbeat,
    openChannelFactory,
    supportChannelFactory,
} from '../src';
import { createMailbox } from '../examples/common/actors/createActor';

export const OPEN_TYPE = 'OPEN_TYPE' as const;
export type TOpenEnvelope = Envelope<typeof OPEN_TYPE, undefined>;
export const CHANNEL_TYPE = 'CHANNEL_TYPE' as const;
export type TChannelEnvelope = Envelope<typeof CHANNEL_TYPE, number>;

describe(`Channel`, () => {
    const createActor = createActorFactory({ getMailbox: createMailbox });

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
                    maxTimeout: 500,
                    checkTimeout: 100,
                    dispatchTimeout: 100,
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
            expect(onHeartbeatTimeout.mock.calls[0][0]).toBeGreaterThanOrEqual(500);
            expect(closeSupportedChannel.mock.calls).toHaveLength(1);
            done();
        }, 1000);
    });
});
