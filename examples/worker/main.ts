import {createActorMain} from "../common/actors/main/actor";
import {connectActorToWorker, createEnvelope} from "../../main";
import {SUM_ACTION_TYPE} from "../common/actors/sum/defs";
import {MINMAX_ACTION_TYPE} from "../common/actors/minmax/defs";
import {LAUNCH_TYPE} from "../common/defs";

const actorMain = createActorMain();
const worker = new Worker(new URL('../common/workers/sumAndMinMaxActors.ts', import.meta.url), {type: 'module'});

connectActorToWorker(
    {
        ref: actorMain,
        map: (envelope) => envelope.type === SUM_ACTION_TYPE || envelope.type === MINMAX_ACTION_TYPE
            ? envelope : undefined
    },
    worker
);

actorMain.dispatch(createEnvelope(LAUNCH_TYPE, undefined));

