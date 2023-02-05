import {SUM_RESULT_TYPE} from "../actors/sum/defs";
import {createActorSum} from "../actors/sum/actor";
import {onConnectMessagePort, connectMessagePortToActor} from "../../../main";

const actorSum = createActorSum();

onConnectMessagePort((name) => {
    return connectMessagePortToActor(
        name,
        { source: actorSum, map: (envelope) => envelope.type === SUM_RESULT_TYPE ? envelope : undefined },
    );
});
