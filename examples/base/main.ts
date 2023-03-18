import { createActorSum } from '../common/actors/sum/actor';
import { createActorMinMax } from '../common/actors/minmax/actor';
import { createActorMain } from '../common/actors/main/actor';
import { connectActorToActor } from '../../src';
import { SUM_ACTION_TYPE } from '../common/actors/sum/defs';
import { MINMAX_ACTION_TYPE } from '../common/actors/minmax/defs';

const actorSum = createActorSum();
const actorMinMax = createActorMinMax();
const actorMain = createActorMain();

connectActorToActor({ source: actorMain, map: (e) => (e.type === SUM_ACTION_TYPE ? e : undefined) }, actorSum);
connectActorToActor({ source: actorMain, map: (e) => (e.type === MINMAX_ACTION_TYPE ? e : undefined) }, actorMinMax);

actorSum.launch();
actorMinMax.launch();
actorMain.launch();
