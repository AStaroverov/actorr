import {createActor} from "../common/actors/createActor";
import {
    MULTIPLY_ACTION_TYPE,
    MULTIPLY_RESULT_TYPE,
    TMultiplyActionEnvelope,
    TMultiplyResultEnvelope
} from "../common/actors/multiply/defs";
import {createEnvelope} from "../../main";
import {LAUNCH_TYPE, TLaunchEnvelope} from "../common/defs";

export function createActorMain() {
    return createActor<
        TLaunchEnvelope | TMultiplyResultEnvelope,
        TMultiplyActionEnvelope
    >('MAIN', (envelope, { dispatch }) => {
        if (envelope.type === LAUNCH_TYPE) {
            dispatch(createEnvelope(MULTIPLY_ACTION_TYPE, [3,4,5]));
        }

        if (envelope.type === MULTIPLY_RESULT_TYPE) {
            console.log('multiply', envelope.payload)
        }
    })
}
