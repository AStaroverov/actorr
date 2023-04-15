import { connectActorToWorker, connectWorkerToWorker } from '../../src';
import { createActorMain } from './actor';

const actorMain = createActorMain();
const sumWorker = new SharedWorker(new URL('../common/workers/sumWorker.ts', import.meta.url), {
    name: 'sumWorker',
    type: 'module',
});
const multiplyWorker = new SharedWorker(new URL('../common/workers/multiplyWorker.ts', import.meta.url), {
    name: 'multiplyWorker',
    type: 'module',
});
const pingWorker = new SharedWorker(new URL('../common/workers/pingWorker.ts', import.meta.url), {
    name: 'pingWorker',
    type: 'module',
});

connectActorToWorker(actorMain, pingWorker);
connectActorToWorker(actorMain, multiplyWorker);

await connectWorkerToWorker(
    { name: 'SUM_WORKER', worker: sumWorker },
    { name: 'MULTIPLY_WORKER', worker: multiplyWorker },
);

actorMain.launch();
