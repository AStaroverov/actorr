import { SUM_RESULT_TYPE } from '../actors/sum/defs';
import { createActorSum } from '../actors/sum/actor';
import { connectMessagePortToActor, onConnectMessagePort } from '../../../src';

const actorSum = createActorSum().launch();

onConnectMessagePort(self as DedicatedWorkerGlobalScope | SharedWorkerGlobalScope, (name, port) => {
    return connectMessagePortToActor(port, {
        transmitter: actorSum,
        map: (envelope) => (envelope.type === SUM_RESULT_TYPE ? envelope : undefined),
    });
});
