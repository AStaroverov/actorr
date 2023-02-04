import {onConnectMessagePort, connectActorToMessagePort} from "../../../main";
import {createActorMultiply} from "../actors/multiply/actor";
import {MULTIPLY_RESULT_TYPE} from "../actors/multiply/defs";
import {SUM_ACTION_TYPE} from "../actors/sum/defs";

const actor = createActorMultiply();

onConnectMessagePort((name) => {
    return connectActorToMessagePort(
        { source: actor, map: (envelope) => {
            switch (envelope.type) {
                case SUM_ACTION_TYPE:
                case MULTIPLY_RESULT_TYPE:
                    return envelope;
                default:
                    return undefined;
            }
        } },
        name
    );
});
