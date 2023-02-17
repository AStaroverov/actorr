import {createActor} from "../common/actors/createActor";
import {createEnvelope} from "../../main";
import {TAnyEnvelope} from "../../src/types";
import {GENERATE_RANDOM_TYPE, TGenerateRandomEnvelope, TNextRandomEnvelope} from "../common/actors/random/defs";
import {
    OPEN_CHANNEL_TYPE,
    PONG_TYPE,
    TOpenChannelEnvelope,
    TPingEnvelope,
    TPongEnvelope
} from "../common/actors/pingpong/defs";
import {openChannelFactory} from "../../src/channel/openChannelFactory";

export function createActorMain() {
    return createActor<
        TNextRandomEnvelope | TPingEnvelope,
        TGenerateRandomEnvelope | TPongEnvelope | TOpenChannelEnvelope
    >('MAIN', (context) => {
        const openChannel = openChannelFactory(context)

        const closeRandomChannel = openChannel(
            createEnvelope(GENERATE_RANDOM_TYPE, undefined),
            (dispatch, subscribe, close) => {
                return subscribe((envelope: TAnyEnvelope) => {
                    console.log('>> Random number', envelope.payload)
                })
            }
        );

        setTimeout(closeRandomChannel, 3000)

        const closePingPongChannel = openChannel<TPingEnvelope, TPongEnvelope>(
            createEnvelope(OPEN_CHANNEL_TYPE, 1),
            (dispatch, subscribe, close) => {
                return subscribe(envelope => {
                    console.log('>> ping', envelope.type, envelope.payload)
                    if (envelope.payload >= 4) {
                        console.log('>> close ping pong', envelope);
                        close();
                    }
                    setTimeout(() => dispatch(createEnvelope(PONG_TYPE, envelope.payload + 1)), 1000)
                })
            }
        )
    })
}
