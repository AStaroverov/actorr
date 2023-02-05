import {createActor} from "../common/actors/createActor";
import {
    MULTIPLY_ACTION_TYPE,
    TMultiplyActionEnvelope,
    TMultiplyResultEnvelope
} from "../common/actors/multiply/defs";
import {createEnvelope, createRequest} from "../../main";
import {LAUNCH_TYPE, TLaunchEnvelope} from "../common/defs";
import {TAnyEnvelope} from "../../src/types";

export function createActorMain() {
    return createActor<
        TLaunchEnvelope | TMultiplyResultEnvelope,
        TMultiplyActionEnvelope
    >('MAIN', (envelope, { dispatch, mailbox }) => {
        console.log('>>', envelope)
        if (envelope.type === LAUNCH_TYPE) {
            // setInterval(() => {
                const arr = Math.random() > 0.5 ? [3,4,5] : [2,3,5];
                const isMultiplyResult = createRequest(dispatch)(createEnvelope(MULTIPLY_ACTION_TYPE, arr));
                const callback = (envelope: TAnyEnvelope) => {
                    if (isMultiplyResult(envelope)) {
                        console.log('>> result', envelope.payload, arr)
                        mailbox.unsubscribe(callback);
                    }
                }

                mailbox.subscribe(callback);
            // }, 100)
        }
    })
}
