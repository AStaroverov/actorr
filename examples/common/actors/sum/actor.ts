import {createActor} from "../createActor";
import {createEnvelope} from "../../../../src/envelope";
import {SUM_ACTION_TYPE, SUM_RESULT_TYPE, TSumActionEnvelope, TSumResultEnvelope} from "./defs";

export function createActorSum() {
    return createActor<TSumActionEnvelope|TSumResultEnvelope>('SUM', (envelope, { dispatch }) => {
        console.log('>>', envelope)
        if (envelope.type === SUM_ACTION_TYPE) {
            dispatch(createEnvelope(SUM_RESULT_TYPE, envelope.payload.reduce((acc, v) => acc + v, 0)))
        }
    })
}
