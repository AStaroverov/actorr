import type {TListener, TSource} from "./types";
import {getMessagePort} from "../worker/ports";
import {isEnvelope} from "../envelope";
import {noop} from "./index";
import {TAnyEnvelope, TSubscribeCallback, TWithSubscribe} from "../types";
import {TMessagePortName} from "../worker/types";

export function subscribe<S extends TSource>(source: S, listener: TListener): Function {
    if (typeof source === 'string') {
        const port = getMessagePort(source);
        return (port === undefined) ? noop : subscribe(port, listener);
    } else if (typeof source === 'object' && 'postMessage' in source) {
        const wrapper = (event: MessageEvent) => {
            if (isEnvelope(event.data)) {
                queueMicrotask(() => listener(event.data));
            }
        }
        source.addEventListener('message', wrapper);
        return () => source.removeEventListener('message', wrapper);
    } else if (typeof source === 'object' && 'subscribe' in source) {
        source.subscribe(listener);
        return () => source.unsubscribe(listener);
    }

    return noop;
}

type TSubscriber<T extends TAnyEnvelope> = (callback: TSubscribeCallback<T>) => Function;

function createSubscribe<T extends TAnyEnvelope>(_source: MessagePort): TSubscriber<T>
function createSubscribe<T extends TAnyEnvelope>(_source: TMessagePortName): TSubscriber<T>
function createSubscribe<T extends TAnyEnvelope>(_source: TWithSubscribe<T>): TSubscriber<T>
function createSubscribe<T extends TAnyEnvelope>(_source: TWithSubscribe<T> | MessagePort | TMessagePortName) {
    const createWrapper = (callback: TSubscribeCallback<T>) => (event: MessageEvent) => {
        if (isEnvelope(event.data)) {
            queueMicrotask(() => callback(event.data));
        }
    }

    return function(callback: TSubscribeCallback<T>): Function {
        const source = typeof _source === 'string' ? getMessagePort(_source) : _source;

        if (typeof source === 'object' && 'subscribe' in source) {
            source.subscribe(callback);
            return () => source.unsubscribe(callback);
        }

        if (typeof source === 'object' && 'postMessage' in source) {
            const wrapper = createWrapper(callback);
            source.addEventListener('message', wrapper);
            return () => source.removeEventListener('message', wrapper);
        }

        return noop;
    }
}

export { createSubscribe };