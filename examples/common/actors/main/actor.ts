import type {TSumActionEnvelope, TSumResultEnvelope} from "../sum/defs";
import type {TMinMaxActionEnvelope, TMinMaxResultEnvelope} from "../minmax/defs";

import {createActor} from "../createActor";
import {createEnvelope, LAUNCH_TYPE} from "../../../../main";
import {SUM_ACTION_TYPE, SUM_RESULT_TYPE} from "../sum/defs";
import {MINMAX_ACTION_TYPE, MINMAX_RESULT_TYPE} from "../minmax/defs";

export function createActorMain() {
    return createActor<
        | TSumActionEnvelope
        | TSumResultEnvelope
        | TMinMaxActionEnvelope
        | TMinMaxResultEnvelope
    >('MAIN', (envelope, {dispatch}) => {
        if (envelope.type === LAUNCH_TYPE) {
            dispatch(createEnvelope(SUM_ACTION_TYPE, [1,2] as [number, number]));
            const arr64 = new Float64Array([1,2,3,4,5,6,7,8,9]);
            dispatch(createEnvelope(MINMAX_ACTION_TYPE, arr64, [arr64]));
        }

        if (envelope.type === MINMAX_RESULT_TYPE) {
            console.log('MinMax', envelope.payload)
        }

        if (envelope.type === SUM_RESULT_TYPE) {
            console.log('Sum', envelope.payload)
        }
    })
}
