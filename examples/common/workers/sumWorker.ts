import {SUM_RESULT_TYPE} from "../actors/sum/defs";
import {createActorSum} from "../actors/sum/actor";
import {onConnectMessagePort, connectActorToMessagePort} from "../../../main";

const actorSum = createActorSum();

onConnectMessagePort((name) => {
    return connectActorToMessagePort(
        { source: actorSum, map: (envelope) => envelope.type === SUM_RESULT_TYPE ? envelope : undefined },
        name
    );
});
