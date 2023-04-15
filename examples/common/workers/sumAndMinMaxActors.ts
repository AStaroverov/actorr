import { createActorSum } from '../actors/sum/actor';
import { createActorMinMax } from '../actors/minmax/actor';
import { connectMessagePortToActor, onConnectMessagePort } from '../../../src';
import { SUM_RESULT_TYPE } from '../actors/sum/defs';

const actorSum = createActorSum().launch();
const actorMinMax = createActorMinMax().launch();

onConnectMessagePort(self as DedicatedWorkerGlobalScope | SharedWorkerGlobalScope, (name, port) => {
    const dis1 = connectMessagePortToActor(port, {
        transmitter: actorSum,
        map: (envelope) => (envelope.type === SUM_RESULT_TYPE ? envelope : undefined),
    });
    const dis2 = connectMessagePortToActor(port, actorMinMax);

    // on disconnect
    return () => {
        dis1();
        dis2();
    };
});
