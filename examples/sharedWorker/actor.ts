import { createActor } from '../common/actors/createActor';
import { MULTIPLY_ACTION_TYPE, TMultiplyActionEnvelope, TMultiplyResultEnvelope } from '../common/actors/multiply/defs';
import { AnyEnvelope, createEnvelope, createRequest, openChannelFactory } from '../../src';
import { PING_TYPE, TPingEnvelope } from '../common/actors/pingpong/defs';
import { createShortRandomString } from '../../src/utils';

export function createActorMain() {
    return createActor<TMultiplyResultEnvelope | TPingEnvelope, TMultiplyActionEnvelope | TPingEnvelope>(
        'MAIN' + createShortRandomString(),
        (context) => {
            const arr = Math.random() > 0.5 ? [3, 4, 5] : [2, 3, 5];
            const request = createRequest(context);
            const close = request(createEnvelope(MULTIPLY_ACTION_TYPE, arr), (envelope: AnyEnvelope) => {
                console.log('>> result', envelope.payload, arr);
                close();
            });

            const openChannel = openChannelFactory(context);
            const closePingChannel = openChannel<TPingEnvelope, TPingEnvelope>(
                createEnvelope(PING_TYPE, 1),
                (channel) => {
                    let pongTimeoutId: undefined | number = undefined;
                    const closeReaction = channel.subscribe((envelope) => {
                        console.log('>>', envelope.type, envelope.payload);
                        pongTimeoutId = self.setTimeout(
                            () => channel.dispatch(createEnvelope(PING_TYPE, envelope.payload + 1)),
                            1000,
                        );
                    });

                    return () => {
                        console.log('>> close main actor');
                        closeReaction();
                        clearTimeout(pongTimeoutId);
                    };
                },
            );
        },
    );
}
