import {connectActorToWorker} from "../../main";
import {connectWorkerToWorker} from "../../src/worker/connectWorkerToWorker";
import {createActorMain} from "./actor";

const actorMain = createActorMain();
const sumWorker = new SharedWorker(
    new URL('../common/workers/sumWorker.ts', import.meta.url), {name: 'sumWorker', type: 'module'});
const multiplyWorker = new SharedWorker(
    new URL('../common/workers/multiplyWorker.ts', import.meta.url), {name: 'multiplyWorker', type: 'module'});

connectActorToWorker(actorMain, multiplyWorker);
connectWorkerToWorker(
    { name: 'sum worker', worker: sumWorker },
    { name: 'multiply worker', worker: multiplyWorker }
);

setTimeout(() => actorMain.launch(), 100);

