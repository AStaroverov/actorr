// import 'jsdom-global/register';
// import 'jsdom-worker';

import { describe, expect, it, jest } from '@jest/globals';
import {
    connectActorToActor,
    createActorFactory,
    createEnvelope,
    TAnyEnvelope,
    TEnvelope,
    TUnknownEnvelope,
} from '../main';
import { createMailbox } from '../examples/common/actors/createActor';

export const NUMBER_TYPE = 'NUMBER_TYPE' as const;
export type TNumberEnvelope = TEnvelope<typeof NUMBER_TYPE, number>;

export const TRIGGER_TYPE = 'TRIGGER_TYPE' as const;
export type TStartEnvelope = TEnvelope<typeof TRIGGER_TYPE, undefined>;

const sleep = (t: number) => new Promise((r) => setTimeout(r, t));

describe(`Worker`, () => {
    const createActor = createActorFactory({ getMailbox: createMailbox });

    it(`asd`, async () => {
        const onMessage = jest.fn();

        // language=TS
        let code = `
            self.onmessage = e => self.postMessage(e.data * 2);
        `;
        let worker = new Worker(URL.createObjectURL(new Blob([code])));
        worker.onmessage = onMessage;
        worker.postMessage(5);

        await sleep(100);
        expect(onMessage).toHaveBeenCalled();
    });
});
