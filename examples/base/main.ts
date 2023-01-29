import {createActorSum} from "../common/actors/sum/actor";
import {createActorMinMax} from "../common/actors/minmax/actor";
import {createActorMain} from "../common/actors/main/actor";
import {connectActorToActor} from "../../main";

const actorSum = createActorSum();
const actorMinMax = createActorMinMax();
const actorMain = createActorMain();

connectActorToActor(actorMain, actorSum);
connectActorToActor(actorMain, actorMinMax);

actorSum.launch();
actorMinMax.launch();
actorMain.launch();
