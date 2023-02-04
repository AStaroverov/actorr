import {createActorSum} from "../actors/sum/actor";
import {createActorMinMax} from "../actors/minmax/actor";
import {onConnectMessagePort, connectActorToMessagePort} from "../../../main";
import {SUM_RESULT_TYPE} from "../actors/sum/defs";

const actorSum = createActorSum();
const actorMinMax = createActorMinMax();

onConnectMessagePort((name) => {
    const dis1 = connectActorToMessagePort(
        { source: actorSum, map: (envelope) => envelope.type === SUM_RESULT_TYPE ? envelope : undefined },
        name
    );
    const dis2 = connectActorToMessagePort(actorMinMax, name);

    // on disconnect
    return () => {
        dis1();
        dis2();
    }
});
