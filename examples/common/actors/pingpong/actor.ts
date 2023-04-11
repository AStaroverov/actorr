import { createActor } from '../createActor';
import { PING_TYPE, TPingEnvelope } from './defs';
import { createEnvelope, supportChannelFactory } from '../../../../src';

export function createPingPongActor(delay: number) {
    return createActor<TPingEnvelope, TPingEnvelope>('PING_PONG', (context) => {
        const supportChannel = supportChannelFactory(context);

        context.subscribe((envelope) => {
            if (envelope.type === PING_TYPE) {
                const close = supportChannel<TPingEnvelope, TPingEnvelope>(envelope, (channel) => {
                    channel.dispatch(createEnvelope(PING_TYPE, envelope.payload + 1));
                    let pingTimeoutId: undefined | number = undefined;
                    const closeReaction = channel.subscribe((envelope) => {
                        console.log('>> n', envelope.payload);
                        pingTimeoutId = self.setTimeout(
                            () => channel.dispatch(createEnvelope(PING_TYPE, envelope.payload + 1)),
                            delay,
                        );
                    });

                    return () => {
                        console.log('>> close ping pong channel');
                        closeReaction();
                        clearTimeout(pingTimeoutId);
                    };
                });
            }
        });
    });
}
