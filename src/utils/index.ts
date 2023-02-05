import type {TSource, TSourceWithMapper} from "./types";

export const noop = (): any => {};
export const identity = <T = any>(v: T) => v;

export function getSource<S>(source: S | TSourceWithMapper<S>) {
    return typeof source === 'object' && 'source' in source! ? source.source : source;
}

export function getMapper<S>(source: S | TSourceWithMapper<S>) {
    return (typeof source === 'object' && 'source' in source! ? source.map : undefined) ?? identity;
}

export function getSourceName<S extends TSource>(source: S) {
    if (typeof source === 'string') return source;
    if (typeof source === 'object') {
        if ('name' in source) return source.name;
        if (source instanceof MessagePort) return 'MessagePort';
    }

    throw new Error('Can`t compute source name');
}

export function getMessagePortName(base: string) {
    return `MessagePort(${base})`;
}
