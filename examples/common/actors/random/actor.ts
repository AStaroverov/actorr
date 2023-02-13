import {createActor} from "../createActor";
import {GENERATE_RANDOM_TYPE, NEXT_RANDOM_TYPE, TGenerateRandomEnvelope, TNextRandomEnvelope} from "./defs";
import {supportChannelFactory} from "../../../../src/channel/supportChannelFactory";
import {createEnvelope} from "../../../../main";

export function createRandomActor() {
    return createActor<
        TGenerateRandomEnvelope,
        TNextRandomEnvelope
    >('RANDOM', (context) => {
        const supportChannel = supportChannelFactory(context);

        context.subscribe((envelope) => {
            if (envelope.type === GENERATE_RANDOM_TYPE) {
                console.log('>>',envelope)
                supportChannel(envelope, (dispatch) => {
                    setInterval(() => dispatch(createEnvelope(NEXT_RANDOM_TYPE, Math.random())), 1000);
                })
            }
        })
    })
}
