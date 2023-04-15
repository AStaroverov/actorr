import { isEnvelope } from './envelope';
import { AnyEnvelope, EnvelopeSubscribeSource, Subscribe, SubscribeCallback, SystemEnvelope } from './types';
import { isSystemEnvelope } from './isSystemEnvelope';

function createWrapper<T extends AnyEnvelope>(callback: SubscribeCallback<T>, withSystemEnvelopes?: void | boolean) {
    return withSystemEnvelopes === true ? callback : (envelope: T) => !isSystemEnvelope(envelope) && callback(envelope);
}

function createPostMessageWrapper<T extends AnyEnvelope>(callback: SubscribeCallback<T>) {
    return (event: MessageEvent) => {
        if (isEnvelope(event.data)) {
            callback(event.data as T);
        }
    };
}

export function createSubscribe<T extends AnyEnvelope>(source: EnvelopeSubscribeSource<T>): Subscribe<T> {
    return function subscribe(callback, withSystemEnvelopes) {
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

        throw new Error('Invalid subscribe source');
    };
}

export function subscribe<T extends AnyEnvelope, F extends false | true | void = false>(
    source: EnvelopeSubscribeSource<T>,
    callback: SubscribeCallback<F extends true ? T | SystemEnvelope : T>,
    withSystemEnvelopes?: F,
): Function {
    return createSubscribe(source)(callback, withSystemEnvelopes);
}
