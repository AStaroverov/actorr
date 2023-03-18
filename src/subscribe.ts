import { getMessagePort } from './worker/ports';
import { isEnvelope } from './envelope';
import { noop } from './utils';
import { AnyEnvelope, Subscribe, SubscribeCallback, EnvelopeSubscribeSource } from './types';
import { isSystemEnvelope } from './isSystemEnvelope';

function createWrapper<T extends AnyEnvelope>(callback: SubscribeCallback<T>, withSystemEnvelopes?: void | boolean) {
    return withSystemEnvelopes === true ? callback : (envelope: T) => !isSystemEnvelope(envelope) && callback(envelope);
}

function createPostMessageWrapper<T extends AnyEnvelope>(callback: SubscribeCallback<T>) {
    return (event: MessageEvent) => {
        if (isEnvelope(event.data)) {
            queueMicrotask(() => callback(event.data));
        }
    };
}

export function createSubscribe<T extends AnyEnvelope>(_source: EnvelopeSubscribeSource<T>): Subscribe<T> {
    return function subscribe(callback, withSystemEnvelopes) {
        const source = typeof _source === 'string' ? getMessagePort(_source) : _source;
        const wrapper = createWrapper(callback, withSystemEnvelopes);

        if (typeof source === 'object' && 'subscribe' in source) {
            // @ts-ignore - second argument not transparent
            return source.subscribe(wrapper, true);
        }

        if (typeof source === 'object' && 'postMessage' in source) {
            const postMessageWrapper = createPostMessageWrapper(wrapper);
            source.addEventListener('message', postMessageWrapper);
            return () => source.removeEventListener('message', postMessageWrapper);
        }

        return noop;
    };
}
