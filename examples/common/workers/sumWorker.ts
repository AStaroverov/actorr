import {createActorSum} from "../actors/sum/actor";
import {createActorMinMax} from "../actors/minmax/actor";
import {onConnectMessagePort, connectActorToMessagePort} from "../../../main";
import {SUM_RESULT_TYPE} from "../actors/sum/defs";

const actorSum = createActorSum().launch();

onConnectMessagePort((name) => {
    return connectActorToMessagePort(
        { source: actorSum, map: (envelope) => envelope.type === SUM_RESULT_TYPE ? envelope : undefined },
        name
    );
});
