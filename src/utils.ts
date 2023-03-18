import { EnvelopeTransmitter, EnvelopeTransmitterWithMapper } from './types';

export const identity = <T = any>(v: T) => v;
export const noop = (): any => {};
export const once = <T extends (...args: any[]) => void>(fn: T): T => {
    return <T>((...args: any[]) => {
        if (fn !== undefined) {
            fn.apply(null, args);
            // @ts-ignore
            fn = undefined;
        }
    });
};

export function getEnvelopeTransmitter<T>(transmitter: T | EnvelopeTransmitterWithMapper<T>): T {
    return typeof transmitter === 'object' && 'ref' in transmitter! && typeof transmitter.ref === 'object'
        ? transmitter.ref
        : (transmitter as T);
}

export function getMapper<T>(source: T | EnvelopeTransmitterWithMapper<T>) {
    return (typeof source === 'object' && 'ref' in source! ? source.map : undefined) ?? identity;
}

export function getName<T extends EnvelopeTransmitter>(source: T) {
    if (typeof source === 'string') return source;
    if (typeof source === 'object') {
        if ('name' in source) return source.name;
        if (source instanceof MessagePort) return 'MessagePort';
    }

    throw new Error('Can`t detect transmitter name');
}

export function getMessagePortName(base: string) {
    return `MessagePort(${base})`;
}

export function getShortRandomString() {
    return Math.round(Math.random() * Date.now()).toString(32);
}
