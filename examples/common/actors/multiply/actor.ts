import { createActor } from '../createActor';
import { MULTIPLY_ACTION_TYPE, MULTIPLY_RESULT_TYPE, TMultiplyActionEnvelope, TMultiplyResultEnvelope } from './defs';
import { SUM_ACTION_TYPE, SUM_RESULT_TYPE, TSumActionEnvelope, TSumResultEnvelope } from '../sum/defs';
import { createEnvelope, createResponseFactory, Envelope } from '../../../../src';

export function createActorMultiply() {
    return createActor<TMultiplyActionEnvelope | TSumResultEnvelope, TMultiplyResultEnvelope | TSumActionEnvelope>(
        'MULTIPLY',
        ({ subscribe, dispatch }) => {
            const createResponse = createResponseFactory(dispatch);
            const unsubscribe = subscribe(async (envelope) => {
                if (envelope.type === MULTIPLY_ACTION_TYPE) {
                    const numbers = envelope.payload;
                    let result = numbers[0];

                    for (let i = 1; i < numbers.length; i++) {
                        dispatch(createEnvelope(SUM_ACTION_TYPE, Array(numbers[i]).fill(result)));
                        result = await new Promise<number>((r) => {
                            const cb = (envelope: Envelope<any, any>) => {
                                if (envelope.type === SUM_RESULT_TYPE) {
                                    unsubscribe(cb);
                                    r(envelope.payload);
                                }
                            };
                            subscribe(cb);
                        });
                    }

                    createResponse(envelope)(createEnvelope(MULTIPLY_RESULT_TYPE, result));
                }
            });
        },
    );
}
