import { describe, expect, it, jest } from '@jest/globals';
import { createActorFactory } from '../main';
import { createMailbox } from '../examples/common/actors/createActor';
import { connectWorkerToWorker } from '../src/worker/connectWorkerToWorker';

describe(`Worker`, () => {
    const createActor = createActorFactory({ getMailbox: createMailbox });

    it(`connectActorToMessagePort`, () => {});

    it(`connectActorToWorker`, () => {});

    it(`connectWorkerToWorker`, () => {});
});
