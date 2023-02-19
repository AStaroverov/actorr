import {TAnyEnvelope, TWithDispatch, TWithSubscribe} from "../types";
import {HEARTBEAT_ENVELOPE} from "./def";
import {createEnvelope} from "../envelope";

export type TPingerOptions = {
    dispatchTimeout?: number,
    checkTimeout?: number,
    maxTimeout?: number,
}
export function createHeartbeat<Out extends TAnyEnvelope, In extends TAnyEnvelope>(
    deb: string,
    context: TWithDispatch<Out> & TWithSubscribe<In>,
    panic: (diff: number) => void,
    options?: TPingerOptions,
) {
    let receivedPingTime: number = Date.now();
    const maxTimeout = options?.maxTimeout ?? 3000;
    const checkTimeout = options?.checkTimeout ?? 1000;
    const dispatchTimeout = options?.dispatchTimeout ?? 1000;

    const dispatchIntervalId = setInterval(() => {
        context.dispatch(createEnvelope(HEARTBEAT_ENVELOPE, Date.now()));
    }, dispatchTimeout);
    const checkIntervalId = setInterval(() => {
        const time = Date.now();
        const diff = time - receivedPingTime;
        diff > maxTimeout && panic(diff);
    }, checkTimeout);
    const unsubscribe = context.subscribe(
        (envelope) => envelope.type === HEARTBEAT_ENVELOPE && (receivedPingTime = envelope.payload),
        true
    );

    return () => {
        clearInterval(dispatchIntervalId);
        clearInterval(checkIntervalId);
        unsubscribe();
    }
}
