import { createActor } from '../createActor';
import { TPongEnvelope, TPingEnvelope, TOpenChannelEnvelope, PING_TYPE, OPEN_CHANNEL_TYPE } from './defs';
import { supportChannelFactory } from '../../../../src/channel/supportChannelFactory';
import { createEnvelope } from '../../../../src';
import { createHeartbeat } from '../../../../src/heartbeat';

export function createPingPongActor(delay: number) {
    return createActor<TPongEnvelope | TOpenChannelEnvelope, TPingEnvelope>('PING_PONG', (context) => {
        const supportChannel = supportChannelFactory(context);

        context.subscribe((envelope) => {
            if (envelope.type === OPEN_CHANNEL_TYPE) {
                const close = supportChannel<TPongEnvelope, TPingEnvelope>(envelope, (ctx) => {
                    ctx.dispatch(createEnvelope(PING_TYPE, envelope.payload + 1));

                    const closePing = createHeartbeat(ctx, () => {
                        console.log('>> Channel requester dont response');
                    });

                    let pingTimeoutId: undefined | number = undefined;
                    const closeReaction = ctx.subscribe((envelope) => {
                        console.log('>>', delay, envelope.type, envelope.payload);
                        pingTimeoutId = setTimeout(
                            () => ctx.dispatch(createEnvelope(PING_TYPE, envelope.payload + 1)),
                            delay,
                        );
                    });

                    return () => {
                        closePing();
                        closeReaction();
                        clearTimeout(pingTimeoutId);
                    };
                });
            }
        });
    });
}
