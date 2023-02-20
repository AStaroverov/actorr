import {createActor} from "../common/actors/createActor";
import {createEnvelope} from "../../main";
import {TGenerateRandomEnvelope, TNextRandomEnvelope} from "../common/actors/random/defs";
import {
    OPEN_CHANNEL_TYPE,
    PONG_TYPE,
    TOpenChannelEnvelope,
    TPingEnvelope,
    TPongEnvelope
} from "../common/actors/pingpong/defs";
import {openChannelFactory} from "../../src/channel/openChannelFactory";
import {createHeartbeat} from "../../src/heartbeat";

export function createActorMain() {
    return createActor<
        TNextRandomEnvelope | TPingEnvelope,
        TGenerateRandomEnvelope | TPongEnvelope | TOpenChannelEnvelope
    >('MAIN', (context) => {
        const openChannel = openChannelFactory(context)

        // const closeRandomChannel = openChannel(
        //     createEnvelope(GENERATE_RANDOM_TYPE, undefined),
        //     (dispatch, subscribe, close) => {
        //         return subscribe((envelope) => {
        //             console.log('>> Random number', envelope.payload)
        //         })
        //     }
        // );
        // setTimeout(closeRandomChannel, 3000)

        const closePingPongChannel = openChannel<TPingEnvelope, TPongEnvelope>(
            createEnvelope(OPEN_CHANNEL_TYPE, 1),
            (context) => {
                debugger
                const closePing = createHeartbeat(context, () => {
                    console.log('>> Channel supporter dont response');
                    context.close();
                });

                let pongTimeoutId: undefined | number = undefined;
                const closeReaction = context.subscribe(envelope => {
                    console.log('>> foo', envelope.type, envelope.payload)
                    if (envelope.payload >= 4) {
                        console.log('>> close foobar', envelope);
                        context.close();
                    }
                    pongTimeoutId = setTimeout(() => context.dispatch(createEnvelope(PONG_TYPE, envelope.payload + 1)), 1000)
                });

                return () => {
                    closePing();
                    closeReaction();
                    clearTimeout(pongTimeoutId);
                }
            }
        )
    })
}
