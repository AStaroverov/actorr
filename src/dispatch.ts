import type {TEnvelope, TEnvelopeDispatchTarget} from "./types";
import {getMessagePort} from "./worker/ports";

export function dispatch<S extends TEnvelopeDispatchTarget>(source: S, envelope: TEnvelope<any, any>) {
    if (typeof source === 'string') {
        queueMicrotask(() => {
            const port = getMessagePort(source);
            if (port !== undefined) dispatch(port, envelope);
        });
    } else if (typeof source === 'object' && 'postMessage' in source) {
        source.postMessage(envelope, envelope.transferable as any);
    } else if (typeof source === 'object' && 'dispatch' in source) {
        source.dispatch(envelope);
    }
}