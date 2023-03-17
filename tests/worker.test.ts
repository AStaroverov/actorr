import { describe, expect, it, jest } from '@jest/globals';
import {
    CONNECT_MESSAGE_PORT_TYPE,
    connectActorToMessagePort,
    connectActorToWorker,
    createActorFactory,
    createEnvelope,
    deleteMessagePort,
    DISCONNECT_MESSAGE_PORT_TYPE,
    getMessagePortName,
    onConnectMessagePort,
    setMessagePort,
    TMessagePortName,
} from '../main';
import { createMailbox } from '../examples/common/actors/createActor';
import { connectWorkerToWorker } from '../src/worker/connectWorkerToWorker';

const { MessageChannel, MessagePort } = require('worker_threads');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class WorkerMock {
    postMessage = jest.fn((message: string | object, transferable: Transferable[]) => {});
    addEventListener = jest.fn();
    removeEventListener = jest.fn();
}

class SharedWorkerMock {
    port = {
        postMessage: jest.fn((message: string | object, transferable: Transferable[]) => {}),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    };
}

class WorkerGlobalScopeMock {
    channel = new MessageChannel();
    dispatch = (data: string | object, ports?: MessagePort[]) => {
        this.channel.port1.postMessage(
            {
                data,
                ports,
            },
            ports,
        );
    };
    postMessage = jest.fn((message: string | object, transferable?: Transferable[]) => {});
    addEventListener = jest.fn((type: 'message', listener: Function) => {
        this.channel.port2.addListener(type, listener);
    });
    removeEventListener = jest.fn((type: 'message', listener: Function) => {
        this.channel.port2.removeListener(type, listener);
    });
}

global.MessageChannel = MessageChannel;
// @ts-ignore
global.Worker = WorkerMock;
// @ts-ignore
global.SharedWorker = SharedWorkerMock;

describe(`Worker`, () => {
    const createActor = createActorFactory({ getMailbox: createMailbox });

    it(`connectActorToMessagePort`, async () => {
        const channel = new MessageChannel();
        const actor = createActor('Actor', (context) => {
            context.dispatch(createEnvelope(`test`, `test`));
        });
        const onMessage = jest.fn();

        channel.port2.on(`message`, onMessage);

        connectActorToMessagePort(actor, channel.port1);

        actor.launch();

        await sleep(10);

        expect(onMessage).toHaveBeenCalled();

        channel.port1.close();
        channel.port2.close();
    });

    it(`connectActorToWorker`, () => {
        const actor = createActor('Actor', (context) => {
            context.dispatch(createEnvelope(`test`, `test`));
        });
        const worker = new WorkerMock();
        const disconnect = connectActorToWorker(actor, worker as unknown as Worker);
        const workerPortName = getMessagePortName(actor.name);

        expect(worker.postMessage).toHaveBeenCalledTimes(1);
        expect(worker.postMessage.mock.calls[0][0]).toEqual(createEnvelope(CONNECT_MESSAGE_PORT_TYPE, workerPortName));
        expect(worker.postMessage.mock.calls[0][1][0]).toBeInstanceOf(MessagePort);

        disconnect();

        expect(worker.postMessage.mock.calls[1][0]).toEqual(
            createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, workerPortName),
        );
    });

    it(`connectWorkerToWorker`, () => {
        const worker1 = new WorkerMock();
        const worker2 = new SharedWorkerMock();
        const name1 = 'worker1';
        const name2 = 'worker2';
        const disconnect = connectWorkerToWorker(
            { name: name1, worker: worker1 as unknown as Worker },
            { name: name2, worker: worker2 as unknown as Worker },
        );

        expect(worker1.postMessage).toHaveBeenCalledTimes(1);
        expect(worker1.postMessage.mock.calls[0][0]).toEqual(
            createEnvelope(CONNECT_MESSAGE_PORT_TYPE, getMessagePortName(name2)),
        );
        expect(worker1.postMessage.mock.calls[0][1][0]).toBeInstanceOf(MessagePort);
        expect(worker2.port.postMessage).toHaveBeenCalledTimes(1);
        expect(worker2.port.postMessage.mock.calls[0][0]).toEqual(
            createEnvelope(CONNECT_MESSAGE_PORT_TYPE, getMessagePortName(name1)),
        );
        expect(worker2.port.postMessage.mock.calls[0][1][0]).toBeInstanceOf(MessagePort);

        disconnect();

        expect(worker1.postMessage.mock.calls[1][0]).toEqual(
            createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, getMessagePortName(name2)),
        );
        expect(worker2.port.postMessage.mock.calls[1][0]).toEqual(
            createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, getMessagePortName(name1)),
        );
    });

    it(`onConnectMessagePort`, async () => {
        const workerScope = new WorkerGlobalScopeMock();
        const portName = getMessagePortName('port');
        const onDisconnect = jest.fn();
        const onConnect = jest.fn((name: string) => onDisconnect);

        const channel = new MessageChannel();
        const setMessagePortMock = jest.fn((name: TMessagePortName, port: MessagePort) => {
            setMessagePort(name, port);
        });
        const deleteMessagePortMock = jest.fn((name: TMessagePortName) => {
            deleteMessagePort(name);
        });

        onConnectMessagePort(workerScope as unknown as DedicatedWorkerGlobalScope, onConnect, {
            isDedicatedWorkerScope: (context): context is DedicatedWorkerGlobalScope => true,
            isSharedWorkerScope: (context): context is SharedWorkerGlobalScope => false,
            setMessagePort: setMessagePortMock,
            deleteMessagePort: deleteMessagePortMock,
        });

        workerScope.dispatch(createEnvelope(CONNECT_MESSAGE_PORT_TYPE, portName), [channel.port1]);

        await sleep(10);

        expect(onConnect).toHaveBeenCalledTimes(1);
        expect(onConnect).toHaveBeenLastCalledWith(portName);
        expect(setMessagePortMock).toHaveBeenCalledTimes(1);
        expect(setMessagePortMock.mock.calls[0][0]).toEqual(portName);
        expect(setMessagePortMock.mock.calls[0][1]).toBeInstanceOf(MessagePort);

        workerScope.dispatch(createEnvelope(DISCONNECT_MESSAGE_PORT_TYPE, portName));

        await sleep(10);

        expect(onDisconnect).toHaveBeenCalledTimes(1);
        expect(deleteMessagePortMock).toHaveBeenCalledTimes(1);
        expect(deleteMessagePortMock).toHaveBeenLastCalledWith(portName);

        workerScope.channel.port1.close();
        workerScope.channel.port2.close();
        channel.port1.close();
        channel.port2.close();
    });
});
