import {createActor} from "../common/actors/createActor";
import {
    MULTIPLY_ACTION_TYPE,
    MULTIPLY_RESULT_TYPE,
    TMultiplyActionEnvelope,
    TMultiplyResultEnvelope
} from "../common/actors/multiply/defs";
import {createEnvelope, LAUNCH_TYPE} from "../../main";

export function createActorMain() {
    return createActor<
        | TMultiplyActionEnvelope
        | TMultiplyResultEnvelope
    >('MAIN', (envelope, { dispatch }) => {
        if (envelope.type === LAUNCH_TYPE) {
            dispatch(createEnvelope(MULTIPLY_ACTION_TYPE, [3,4,5]));
        }

        if (envelope.type === MULTIPLY_RESULT_TYPE) {
            console.log('multiply', envelope.payload)
        }
    })
}
