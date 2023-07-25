import { EnvelopeTransmitter, EnvelopeTransmitterWithMapper } from '../types';
import { getPortName } from './MessagePort';

export const identity = <T = any>(v: T) => v;
export const noop = (): any => {};

export function createShortRandomString() {
    return Math.round(Math.random() * Date.now()).toString(32);
}

export function getEnvelopeTransmitter<T>(transmitter: T | EnvelopeTransmitterWithMapper<T>): T {
    return typeof transmitter === 'object' && 'transmitter' in transmitter!
        ? transmitter.transmitter
        : (transmitter as T);
}

export function getTransmitterMapper<T>(transmitter: T | EnvelopeTransmitterWithMapper<T>) {
    return (typeof transmitter === 'object' && 'transmitter' in transmitter! ? transmitter.map : undefined) ?? identity;
}

export function getTransmitterName<T extends EnvelopeTransmitter>(source: T) {
    if ('name' in source) return source.name;
    if (typeof source === 'object' && 'postMessage' in source) return getPortName(source);

    throw new Error('Can`t detect transmitter name');
}
