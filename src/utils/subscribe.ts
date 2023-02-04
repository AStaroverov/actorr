import type {TListener, TSource} from "./types";
import {getMessagePort} from "../worker/ports";
import {isEnvelope} from "../envelope";
import {noop} from "./index";

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