import type {TSourceWithMapper} from "./types";

export const noop = (): any => {};
export const identity = <T = any>(v: T) => v;


export function getSource<S>(source: S | TSourceWithMapper<S>) {
    return typeof source === 'object' && 'source' in source! ? source.source : source;
}

export function getMapper<S>(source: S | TSourceWithMapper<S>) {
    return (typeof source === 'object' && 'source' in source! ? source.map : undefined) ?? identity;
}