import { TMessagePortName } from './types';

const mapWorkerNameToWeakPort = new Map<TMessagePortName, WeakRef<MessagePort>>();
const mapWorkerNameToFinalize = new Map<TMessagePortName, VoidFunction[]>();
const finalizationRegistry = new FinalizationRegistry<TMessagePortName>((holdName) =>
    mapWorkerNameToFinalize.get(holdName)?.forEach((fn) => fn()),
);

export const addMessagePort = (name: TMessagePortName, port: MessagePort) => {
    mapWorkerNameToWeakPort.set(name, new WeakRef(port));
    finalizationRegistry.register(port, name);
    onMessagePortFinalize(name, () => mapWorkerNameToWeakPort.delete(name));
};

export const hasMessagePort = (name: TMessagePortName) => {
    return mapWorkerNameToWeakPort.get(name)?.deref() !== undefined;
};

export const getMessagePort = (name: TMessagePortName) => {
    return mapWorkerNameToWeakPort.get(name)?.deref();
};

export const getAllMessagePorts = () => {
    return [...mapWorkerNameToWeakPort.entries()]
        .map(([name, ref]): [TMessagePortName, undefined | MessagePort] => [name, ref.deref()])
        .filter((entry): entry is [TMessagePortName, MessagePort] => entry[1] !== undefined);
};

export const onMessagePortFinalize = (name: TMessagePortName, fn: VoidFunction) => {
    const fns = (mapWorkerNameToFinalize.get(name) ?? [])

    fns.push(fn);
    mapWorkerNameToFinalize.set(name, fns);
};
