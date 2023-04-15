import { createActor } from '../common/actors/createActor';
import { createEnvelope, openChannelFactory } from '../../src';
import { TGenerateRandomEnvelope, TNextRandomEnvelope } from '../common/actors/random/defs';
import { PING_TYPE, TPingEnvelope } from '../common/actors/pingpong/defs';

export function createActorMain() {
    return createActor<TNextRandomEnvelope | TPingEnvelope, TGenerateRandomEnvelope | TPingEnvelope>(
        'MAIN',
        (context) => {
            const openChannel = openChannelFactory(context);

            // const closeRandomChannel = openChannel(
            //     createEnvelope(GENERATE_RANDOM_TYPE, undefined),
            //     (dispatch, subscribe, close) => {
            //         return subscribe((envelope) => {
            //             console.log('>> Random number', envelope.payload)
            //         })
            //     }
            // );
            // setTimeout(closeRandomChannel, 3000)

            const closePingPongChannel = openChannel<TPingEnvelope, TPingEnvelope>(
                createEnvelope(PING_TYPE, 1),
                (channel) => {
                    // const closePing = createHeartbeat(context, () => {
                    //     console.log('>> Channel supporter dont response');
                    //     context.close();
                    // });

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
                        // closePing();
                        closeReaction();
                        clearTimeout(pongTimeoutId);
                    };
                },
            );
        },
    );
}
