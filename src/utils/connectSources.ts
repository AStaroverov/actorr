import type {TSource, TSourceWithMapper} from "./types";
import type {TEnvelope} from "../types";
import {getMapper, getSource} from "./index";
import {subscribe} from "./subscribe";
import {dispatch} from "./dispatch";


export function connectSources<S1 extends TSource, S2 extends TSource>(
    _source1: S1 | TSourceWithMapper<S1>,
    _source2: S2 | TSourceWithMapper<S2>
) {
    const source1 = getSource(_source1);
    const source2 = getSource(_source2);
    const mapper1 = getMapper(_source1);
    const mapper2 = getMapper(_source2);

    const transferredEnvelopes = new WeakSet<TEnvelope<any, any>>();
    const messageTransfer1 = createMessageTransfer(transferredEnvelopes, mapper1, source2);
    const messageTransfer2 = createMessageTransfer(transferredEnvelopes, mapper2, source1);

    const unsub1 = subscribe(source1, messageTransfer1);
    const unsub2 = subscribe(source2, messageTransfer2);

    return () => {
        unsub1();
        unsub2();
    }
}

function createMessageTransfer(
    transferredEnvelopes: WeakSet<TEnvelope<any, any>>,
    mapper: (envelope: TEnvelope<any, any>) => undefined | TEnvelope<any, any>,
    target: TSource,
) {
    return function messageTransfer(_env: TEnvelope<any, any>) {
        const env = mapper(_env);

        if (env !== undefined && !transferredEnvelopes.has(env)) {
            transferredEnvelopes.add(env);

            try {
                dispatch(target, env);
            } catch (err) {
                console.error(err);
            }
        }
    };
}