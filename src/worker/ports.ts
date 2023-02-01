import { TMessagePortName } from './types';

const mapWorkerNameToWeakPort = new Map<TMessagePortName, WeakRef<MessagePort>>();
const mapWorkerNameToFinalize = new Map<TMessagePortName, Array<Function>>();
const finalizationRegistry = new FinalizationRegistry<TMessagePortName>((holdName) => {
    deleteMessagePort(holdName);
});

export const getMessagePort = (name: TMessagePortName) => {
    return mapWorkerNameToWeakPort.get(name)?.deref();
};

export const setMessagePort = (name: TMessagePortName, port: MessagePort) => {
    deleteMessagePort(name);
    mapWorkerNameToWeakPort.set(name, new WeakRef(port));
    finalizationRegistry.register(port, name, port);
};

export const finalizeMessagePort = (name: TMessagePortName) => {
    const finalizers = mapWorkerNameToFinalize.get(name);

    if (finalizers !== undefined) {
        for (const fn of finalizers) {
            fn();
        }
    }

    mapWorkerNameToFinalize.delete(name);
};

export const deleteMessagePort = (name: TMessagePortName) => {
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
        .map(([name, ref]): [TMessagePortName, undefined | MessagePort] => [name, ref.deref()])
        .filter((entry): entry is [TMessagePortName, MessagePort] => entry[1] !== undefined);
};

export const onMessagePortFinalize = (name: TMessagePortName, fn: Function) => {
    if (!mapWorkerNameToFinalize.has(name)) {
        mapWorkerNameToFinalize.set(name, []);
    }

    mapWorkerNameToFinalize.get(name)!.push(fn);
};
