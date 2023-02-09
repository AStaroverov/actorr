import {createActor} from "../createActor";
import {createEnvelope} from "../../../../src/envelope";
import {SUM_ACTION_TYPE, SUM_RESULT_TYPE, TSumActionEnvelope, TSumResultEnvelope} from "./defs";
import {createResponse} from "../../../../main";

export function createActorSum() {
    return createActor<TSumActionEnvelope, TSumResultEnvelope>('SUM', ({ dispatch, subscribe }) => {
        subscribe((envelope) => {
            if (envelope.type === SUM_ACTION_TYPE) {
                console.log('>>',envelope)
                createResponse(dispatch, envelope)(
                    createEnvelope(SUM_RESULT_TYPE, envelope.payload.reduce((acc, v) => acc + v, 0))
                )
            }
        })
    })
}
