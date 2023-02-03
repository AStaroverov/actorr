import type {TEnvelope} from "./types";
import {DESTROY_TYPE, LAUNCH_TYPE} from "./defs";

export function createEnvelope<T extends string, P>(
    type: T,
    payload: P,
    transferable?: undefined | Transferable[]
): TEnvelope<T, P> {
    return { type, payload, transferable };
}

export function isEnvelope<T extends TEnvelope<any, any>>(some: any): some is T {
    return typeof some === 'object' && typeof some.type === 'string';
}

export function isSystemEnvelope<T extends TEnvelope<any, any>>(some: any): some is T {
    return isEnvelope(some) && some.type === LAUNCH_TYPE || some.type === DESTROY_TYPE;
}
