import {TAnyEnvelope, TWithDispatch, TWithSubscribe} from "../types";
import {HEARTBEAT_ENVELOPE} from "./def";
import {createEnvelope} from "../envelope";

export type THeartbeatOptions = {
    maxTimeout?: number,
    checkTimeout?: number,
    dispatchTimeout?: number,
}
export function createHeartbeat<Out extends TAnyEnvelope, In extends TAnyEnvelope>(
    context: TWithDispatch<Out> & TWithSubscribe<In>,
    panic: (diff: number) => void,
    options?: THeartbeatOptions,
) {
    const envelope = createEnvelope(HEARTBEAT_ENVELOPE, undefined);
    const maxTimeout = options?.maxTimeout ?? 3000;
    const checkTimeout = options?.checkTimeout ?? 1000;
    const dispatchTimeout = options?.dispatchTimeout ?? 1000;
    let lastEnvelopeTime: number = Date.now();

    const dispatchIntervalId = setInterval(
        () => context.dispatch(envelope),
        dispatchTimeout
    );
    const checkIntervalId = setInterval(() => {
        const time = Date.now();
        const diff = time - lastEnvelopeTime;
        diff > maxTimeout && panic(diff);
    }, checkTimeout);
    const unsubscribe = context.subscribe(
        () => (lastEnvelopeTime = Date.now()),
        true
    );

    return () => {
        clearInterval(dispatchIntervalId);
        clearInterval(checkIntervalId);
        unsubscribe();
    }
}
