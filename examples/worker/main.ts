import {createActorMain} from "../common/actors/main/actor";
import {connectActorToWorker} from "../../main";

const actorMain = createActorMain();
const worker = new Worker(new URL('../common/workers/sumAndMinMaxActors.ts', import.meta.url), {type: 'module'});

connectActorToWorker(actorMain, worker);

actorMain.launch()

