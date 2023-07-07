import { connectActorToWorker } from '../../src';
import { createActorMain } from './actor';

const actorMain1 = createActorMain();
const actorMain2 = createActorMain();
// const sumWorker = new SharedWorker(new URL('../common/workers/sumWorker.ts', import.meta.url), {
//     name: 'sumWorker',
//     type: 'module',
// });
// const multiplyWorker = new SharedWorker(new URL('../common/workers/multiplyWorker.ts', import.meta.url), {
//     name: 'multiplyWorker',
//     type: 'module',
// });
const pingWorker = new SharedWorker(new URL('../common/workers/pingWorker.ts', import.meta.url), {
    name: 'pingWorker',
    type: 'module',
});

connectActorToWorker(actorMain1, pingWorker);
connectActorToWorker(actorMain2, pingWorker);
// connectActorToWorker(actorMain, multiplyWorker);

// await connectWorkerToWorker(
//     { name: 'SUM_WORKER', worker: sumWorker },
//     { name: 'MULTIPLY_WORKER', worker: multiplyWorker },
// );

actorMain1.launch();
actorMain2.launch();
