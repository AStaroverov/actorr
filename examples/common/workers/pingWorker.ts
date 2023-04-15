import { connectMessagePortToActor, onConnectMessagePort } from '../../../src';
import { createPingPongActor } from '../actors/pingpong/actor';

const actor = createPingPongActor(1000).launch();

onConnectMessagePort(self as DedicatedWorkerGlobalScope | SharedWorkerGlobalScope, (port) => {
    return connectMessagePortToActor(port, actor);
});
