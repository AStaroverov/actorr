import { EnvelopeTransmitter, EnvelopeTransmitterWithMapper } from './types';
import { PING, PONG } from './defs';

export const identity = <T = any>(v: T) => v;
export const noop = (): any => {};

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

export function waitMessagePort(port: MessagePort, signal?: AbortSignal) {
    const sendPing = () => port.postMessage(PING);

    return new Promise((resolve, reject) => {
        const intervalId = setInterval(sendPing, 25);
        const clear = () => {
            clearInterval(intervalId);
            port.removeEventListener('message', portListener);
            signal?.removeEventListener('abort', abortListener);
        };
        const portListener = (event: MessageEvent) => {
            if (event.data === PONG) {
                clear();
                resolve(undefined);
            }
        };
        const abortListener = () => {
            clear();
            reject(new Error('Aborted'));
        };

        port.start();
        port.addEventListener('message', portListener);
        signal?.addEventListener('abort', abortListener);

        queueMicrotask(sendPing);
    });
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
