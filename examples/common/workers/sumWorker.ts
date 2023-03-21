import { SUM_RESULT_TYPE } from '../actors/sum/defs';
import { createActorSum } from '../actors/sum/actor';
import { onConnectMessagePort, connectMessagePortToActor } from '../../../src';

const actorSum = createActorSum().launch();

onConnectMessagePort(self as DedicatedWorkerGlobalScope | SharedWorkerGlobalScope, (name) => {
    return connectMessagePortToActor(name, {
        transmitter: actorSum,
        map: (envelope) => (envelope.type === SUM_RESULT_TYPE ? envelope : undefined),
    });
});
