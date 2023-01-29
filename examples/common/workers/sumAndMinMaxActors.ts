import {createActorSum} from "../actors/sum/actor";
import {createActorMinMax} from "../actors/minmax/actor";
import {onConnectMessagePort, connectActorToMessagePort} from "../../../main";

const actorSum = createActorSum().launch();
const actorMinMax = createActorMinMax().launch();

onConnectMessagePort((name) => {
    connectActorToMessagePort(actorSum, name);
    connectActorToMessagePort(actorMinMax, name);
})

