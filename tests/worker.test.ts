import { describe, expect, it, jest } from '@jest/globals';
import {
    connectActorToMessagePort,
    connectActorToWorker,
    createActorFactory,
    createEnvelope,
    createMessagePortName,
    onConnectMessagePort,
    subscribe,
} from '../src';
import { createMailbox } from '../examples/common/actors/createActor';
import { sleep } from './utils';
import { WorkerGlobalScopeMock, WorkerMock } from './mocks';
import { CONNECT_MESSAGE_PORT_TYPE, DISCONNECT_MESSAGE_PORT_TYPE } from '../src/worker/defs';

describe(`Worker`, () => {
    const createActor = createActorFactory({ getMailbox: createMailbox });

    it(`connectActorToMessagePort`, async () => {
        const channel = new MessageChannel();
        const actor = createActor('Actor', (context) => {
            context.dispatch(createEnvelope(`test`, `test`));
        });
        const onMessage = jest.fn();

        subscribe(channel.port2, onMessage);
        connectActorToMessagePort(actor, channel.port1);

        actor.launch();

        await sleep(10);

        expect(onMessage).toHaveBeenCalled();

        channel.port1.close();
        channel.port2.close();
    });

    it(`connectActorToWorker`, async () => {
        const actor = createActor('Actor', (context) => {
            context.dispatch(createEnvelope(`test`, `test`));
        });
        const worker = new WorkerMock();
        const disconnect = connectActorToWorker(actor, worker as unknown as Worker);

        await sleep(10);

        expect(worker.postMessage).toHaveBeenCalledTimes(2);
        expect(worker.postMessage.mock.calls[1]).toEqual([
            createEnvelope(CONNECT_MESSAGE_PORT_TYPE, expect.stringContaining('MessagePort')),
        ]);

        disconnect();

        expect(worker.postMessage.mock.calls[2][0]).toEqual(
            createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, expect.stringContaining('MessagePort')),
        );

        worker.terminate();
    });

    // ADD TEST FOR MULTIPLE connectWorkerToWorker
    // it(`connectWorkerToWorker`, async () => {
    //     const worker1 = new WorkerMock();
    //     const worker2 = new SharedWorkerMock();
    //     const name1 = 'worker1';
    //     const name2 = 'worker2';
    //     const disconnect = await connectWorkerToWorker(
    //         { name: name1, worker: worker1 as unknown as Worker },
    //         { name: name2, worker: worker2 as unknown as Worker },
    //     );
    //
    //     expect(worker1.postMessage.mock.lastCall?.[0]).toEqual(
    //         createEnvelope(CONNECT_MESSAGE_PORT_TYPE, expect.stringContaining(name2)),
    //     );
    //     expect(worker1.postMessage.mock.lastCall?.[1]?.[0]).toBeInstanceOf(MessagePort);
    //     expect(worker2.port.postMessage.mock.lastCall?.[0]).toEqual(
    //         createEnvelope(CONNECT_MESSAGE_PORT_TYPE, expect.stringContaining(name1)),
    //     );
    //     expect(worker2.port.postMessage.mock.lastCall?.[1]?.[0]).toBeInstanceOf(MessagePort);
    //
    //     disconnect();
    //
    //     expect(worker1.postMessage.mock.lastCall?.[0]).toEqual(
    //         createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, expect.stringContaining(name2)),
    //     );
    //     expect(worker2.port.postMessage.mock.lastCall?.[0]).toEqual(
    //         createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, expect.stringContaining(name1)),
    //     );
    //
    //     worker1.terminate();
    //     worker2.terminate();
    // });

    it(`onConnectMessagePort`, async () => {
        const workerScope = new WorkerGlobalScopeMock();
        const portName = createMessagePortName('port');
        const onDisconnect = jest.fn();
        const onConnect = jest.fn((name: string, port: MessagePort) => onDisconnect);

        const channel = new MessageChannel();

        onConnectMessagePort(workerScope as unknown as DedicatedWorkerGlobalScope, onConnect, {
            isDedicatedWorkerScope: (context): context is DedicatedWorkerGlobalScope => true,
            isSharedWorkerScope: (context): context is SharedWorkerGlobalScope => false,
        });

        workerScope.dispatch(createEnvelope(CONNECT_MESSAGE_PORT_TYPE, portName), [channel.port1]);

        await sleep(10);

        expect(onConnect).toHaveBeenCalledTimes(1);
        expect(onConnect.mock.lastCall?.[0]).toBe(portName);
        expect(onConnect.mock.lastCall?.[1]).toBeInstanceOf(WorkerGlobalScopeMock);

        workerScope.dispatch(createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, portName));

        await sleep(10);

        expect(onDisconnect).toHaveBeenCalledTimes(1);

        workerScope.channel.port1.close();
        workerScope.channel.port2.close();

        workerScope.terminate();

        channel.port1.close();
        channel.port2.close();
    });
});
