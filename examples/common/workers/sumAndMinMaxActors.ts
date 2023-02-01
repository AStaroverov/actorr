import {createActorSum} from "../actors/sum/actor";
import {createActorMinMax} from "../actors/minmax/actor";
import {onConnectMessagePort, connectActorToMessagePort} from "../../../main";

const actorSum = createActorSum().launch();
const actorMinMax = createActorMinMax().launch();

onConnectMessagePort((name) => {
    const dis1 = connectActorToMessagePort(actorSum, name);
    const dis2 = connectActorToMessagePort(actorMinMax, name);

    // on disconnect
    return () => {
        dis1();
        dis2();
    }
});
