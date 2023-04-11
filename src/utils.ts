import { EnvelopeTransmitter, EnvelopeTransmitterWithMapper } from './types';
import { PING, PONG } from './defs';

export const identity = <T = any>(v: T) => v;
export const noop = (): any => {};

export function createShortRandomString() {
    return Math.round(Math.random() * Date.now()).toString(32);
}

export function createMessagePortName(base: string) {
    return `MessagePort(${base})`;
}

export function getEnvelopeTransmitter<T>(transmitter: T | EnvelopeTransmitterWithMapper<T>): T {
    return typeof transmitter === 'object' && 'transmitter' in transmitter!
        ? transmitter.transmitter
        : (transmitter as T);
}

export function getMapper<T>(transmitter: T | EnvelopeTransmitterWithMapper<T>) {
    return (typeof transmitter === 'object' && 'transmitter' in transmitter! ? transmitter.map : undefined) ?? identity;
}

export function getName<T extends EnvelopeTransmitter>(source: T) {
    if (typeof source === 'string') return source;
    if (typeof source === 'object') {
        if ('name' in source) return source.name;
        if (source instanceof MessagePort) return 'MessagePort';
    }

    throw new Error('Can`t detect transmitter name');
}

export function waitMessagePort(port: MessagePort) {
    const sendPing = () => port.postMessage(PING);

    return new Promise((resolve) => {
        const intervalId = setInterval(sendPing, 25);
        const listener = (event: MessageEvent) => {
            if (event.data === PONG) {
                resolve(undefined);
                clearInterval(intervalId);
                port.removeEventListener('message', listener);
            }
        };

        port.start();
        port.addEventListener('message', listener);

        queueMicrotask(sendPing);
    });
}
