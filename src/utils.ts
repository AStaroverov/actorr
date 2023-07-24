import { EnvelopeTransmitter, EnvelopeTransmitterWithMapper } from './types';
import { CLOSE, PING, PONG } from './defs';
import { intervalProvider, timeoutProvider } from './providers';

export const identity = <T = any>(v: T) => v;
export const noop = (): any => {};

export function closeMessagePort(port: MessagePort) {
    port.postMessage(CLOSE);
    port.close();
}

export function createShortRandomString() {
    return Math.round(Math.random() * Date.now()).toString(32);
}

export function createMessagePortName(base: string = 'Unknown') {
    return `MessagePort(${base})[${createShortRandomString()}]`;
}

export function getEnvelopeTransmitter<T>(transmitter: T | EnvelopeTransmitterWithMapper<T>): T {
    return typeof transmitter === 'object' && 'transmitter' in transmitter!
        ? transmitter.transmitter
        : (transmitter as T);
}

export function getTransmitterMapper<T>(transmitter: T | EnvelopeTransmitterWithMapper<T>) {
    return (typeof transmitter === 'object' && 'transmitter' in transmitter! ? transmitter.map : undefined) ?? identity;
}

const mapPortToName = new WeakMap<MessagePort, string>();

export function setPortName(port: MessagePort, name: string) {
    const currentName = mapPortToName.get(port);

    if (currentName === undefined) {
        mapPortToName.set(port, name);
    } else {
        console.warn(`Port name already set to "${currentName}", can't set to "${name}"`);
    }
}

export function getPortName(port: MessagePort) {
    if (!mapPortToName.has(port)) setPortName(port, createMessagePortName());
    return mapPortToName.get(port)!;
}

export function getTransmitterName<T extends EnvelopeTransmitter>(source: T) {
    if ('name' in source) return source.name;
    if (typeof source === 'object' && 'postMessage' in source) return getPortName(source);

    throw new Error('Can`t detect transmitter name');
}

const mapPortToState = new WeakMap<MessagePort, boolean | Promise<boolean>>();

export function onPortResolve(port: MessagePort, callback: (state: boolean) => void): void {
    if (!mapPortToState.has(port)) {
        const promise = new Promise<boolean>((resolve, reject) => {
            const timeoutId = timeoutProvider.setTimeout(
                () => reject(new Error('Message port was rejected on timeout')),
                60_000,
            );
            const intervalId = intervalProvider.setInterval(() => port.postMessage(PING), 25);
            const clear = () => {
                timeoutProvider.clearTimeout(timeoutId);
                intervalProvider.clearInterval(intervalId);
                port.removeEventListener('message', portListener);
            };
            const portListener = (event: MessageEvent) => {
                if (event.data === PONG) {
                    clear();
                    resolve(true);
                    mapPortToState.set(port, true);
                } else if (event.data === CLOSE) {
                    clear();
                    resolve(false);
                    mapPortToState.set(port, false);
                }
            };

            port.start();
            port.addEventListener('message', portListener);

            queueMicrotask(() => port.postMessage(PING));
        });

        mapPortToState.set(port, promise);
    }

    const state = mapPortToState.get(port)!;

    if (state instanceof Promise) {
        state.then(callback);
    } else {
        callback(state);
    }
}

export function isPortReadyCheck(event: MessageEvent) {
    return event.data === PING;
}

export function checkPortAsReady(port: MessagePort | DedicatedWorkerGlobalScope) {
    port.postMessage(PONG);
}

export function checkPortAsReadyOnMessage(event: MessageEvent) {
    if (isPortReadyCheck(event)) checkPortAsReady(event.target as MessagePort);
}
