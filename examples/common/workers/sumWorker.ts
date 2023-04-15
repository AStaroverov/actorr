import { SUM_RESULT_TYPE } from '../actors/sum/defs';
import { createActorSum } from '../actors/sum/actor';
import { connectMessagePortToActor, onConnectMessagePort } from '../../../src';

onConnectMessagePort(self as DedicatedWorkerGlobalScope | SharedWorkerGlobalScope, (port) => {
    const actorSum = createActorSum().launch();
    const disconnect = connectMessagePortToActor(port, {
        transmitter: actorSum,
        map: (envelope) => (envelope.type === SUM_RESULT_TYPE ? envelope : undefined),
    });

    return () => {
        disconnect();
        actorSum.destroy();
    };
});
