import { connectMessagePortToActor, onConnectMessagePort } from '../../../src';
import { createActorMultiply } from '../actors/multiply/actor';

const actor = createActorMultiply().launch();

onConnectMessagePort(self as DedicatedWorkerGlobalScope | SharedWorkerGlobalScope, (name, port) => {
    return connectMessagePortToActor(port, actor);
});
