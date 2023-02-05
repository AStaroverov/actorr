import {onConnectMessagePort, connectActorToMessagePort, getMessagePortName} from "../../../main";
import {createActorMultiply} from "../actors/multiply/actor";
import {MULTIPLY_ACTION_TYPE, MULTIPLY_RESULT_TYPE} from "../actors/multiply/defs";
import {SUM_ACTION_TYPE, SUM_RESULT_TYPE} from "../actors/sum/defs";

const actor = createActorMultiply();

onConnectMessagePort((name) => {
    if (getMessagePortName('MAIN') === name) {
        return connectActorToMessagePort(
            { source: actor, map: (envelope) => {
                switch (envelope.type) {
                    case MULTIPLY_RESULT_TYPE: return envelope;
                    default: return undefined;
                }
            } },
            { source: name, map: (envelope) => {
                switch (envelope.type) {
                    case MULTIPLY_ACTION_TYPE: return envelope;
                    default: return undefined;
                }
            } }
        );
    }

    if (getMessagePortName('SUM_WORKER') === name) {
        return connectActorToMessagePort(
            { source: actor, map: (envelope) => {
                switch (envelope.type) {
                    case SUM_ACTION_TYPE: return envelope;
                    default: return undefined;
                }
            } },
            { source: name, map: (envelope) => {
                switch (envelope.type) {
                    case SUM_RESULT_TYPE: return envelope;
                    default: return undefined;
                }
            } }
        );
    }
});
