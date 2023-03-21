import { createActorSum } from '../actors/sum/actor';
import { createActorMinMax } from '../actors/minmax/actor';
import { onConnectMessagePort, connectMessagePortToActor } from '../../../src';
import { SUM_RESULT_TYPE } from '../actors/sum/defs';

const actorSum = createActorSum().launch();
const actorMinMax = createActorMinMax().launch();

onConnectMessagePort(self as DedicatedWorkerGlobalScope | SharedWorkerGlobalScope, (name) => {
    const dis1 = connectMessagePortToActor(name, {
        transmitter: actorSum,
        map: (envelope) => (envelope.type === SUM_RESULT_TYPE ? envelope : undefined),
    });
    const dis2 = connectMessagePortToActor(name, actorMinMax);

    // on disconnect
    return () => {
        dis1();
        dis2();
    };
});
