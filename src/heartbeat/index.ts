import { AnyEnvelope, WithDispatch, WithSubscribe } from '../types';
import { HEARTBEAT_ENVELOPE } from './def';
import { createEnvelope } from '../envelope';
import { intervalProvider } from '../providers';

export type HeartbeatOptions = {
    maxTimeout?: number;
    checkTimeout?: number;
    dispatchTimeout?: number;
};
export function createHeartbeat<Out extends AnyEnvelope, In extends AnyEnvelope>(
    context: WithDispatch<Out> & WithSubscribe<In>,
    panic: (diff: number) => void,
    options?: HeartbeatOptions,
) {
    const envelope = createEnvelope(HEARTBEAT_ENVELOPE, undefined);
    const maxTimeout = options?.maxTimeout ?? 3000;
    const checkTimeout = options?.checkTimeout ?? 1000;
    const dispatchTimeout = options?.dispatchTimeout ?? 1000;
    let currentTimeout: number = 0;

    const dispatchIntervalId = intervalProvider.setInterval(() => context.dispatch(envelope), dispatchTimeout);
    const checkIntervalId = intervalProvider.setInterval(() => {
        currentTimeout = currentTimeout + checkTimeout;
        currentTimeout >= maxTimeout && panic(currentTimeout);
    }, checkTimeout);
    const unsubscribe = context.subscribe(() => (currentTimeout = 0), true);

    return () => {
        intervalProvider.clearInterval(dispatchIntervalId);
        intervalProvider.clearInterval(checkIntervalId);
        unsubscribe();
    };
}
