import { MessagePortName } from './types';

const mapWorkerNameToWeakPort = new Map<MessagePortName, WeakRef<MessagePort>>();
const mapWorkerNameToFinalize = new Map<MessagePortName, Array<Function>>();
const finalizationRegistry = new FinalizationRegistry<MessagePortName>((holdName) => {
    deleteMessagePort(holdName);
});

export const getMessagePort = (name: MessagePortName) => {
    return mapWorkerNameToWeakPort.get(name)?.deref();
};

export const setMessagePort = (name: MessagePortName, port: MessagePort) => {
    deleteMessagePort(name);
    mapWorkerNameToWeakPort.set(name, new WeakRef(port));
    finalizationRegistry.register(port, name, port);
};

export const finalizeMessagePort = (name: MessagePortName) => {
    const finalizers = mapWorkerNameToFinalize.get(name);

    if (finalizers !== undefined) {
        for (const fn of finalizers) {
            fn();
        }
    }

    mapWorkerNameToFinalize.delete(name);
};

export const deleteMessagePort = (name: MessagePortName) => {
    finalizeMessagePort(name);

    const port = getMessagePort(name);

    if (port !== undefined) {
        finalizationRegistry.unregister(port);
        port.close();
    }

    mapWorkerNameToWeakPort.delete(name);
};

export const getAllMessagePorts = () => {
    return [...mapWorkerNameToWeakPort.entries()]
        .map(([name, ref]): [MessagePortName, undefined | MessagePort] => [name, ref.deref()])
        .filter((entry): entry is [MessagePortName, MessagePort] => entry[1] !== undefined);
};

export const onMessagePortFinalize = (name: MessagePortName, fn: Function) => {
    if (!mapWorkerNameToFinalize.has(name)) {
        mapWorkerNameToFinalize.set(name, []);
    }

    mapWorkerNameToFinalize.get(name)!.push(fn);
};
