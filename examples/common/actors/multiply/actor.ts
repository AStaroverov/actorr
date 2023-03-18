import { createActor } from '../createActor';
import { createEnvelope } from '../../../../src/envelope';
import { MULTIPLY_ACTION_TYPE, MULTIPLY_RESULT_TYPE, TMultiplyActionEnvelope, TMultiplyResultEnvelope } from './defs';
import { SUM_ACTION_TYPE, SUM_RESULT_TYPE, TSumActionEnvelope, TSumResultEnvelope } from '../sum/defs';
import { TEnvelope } from '../../../../src/types';
import { responseFactory } from '../../../../src';

export function createActorMultiply() {
    return createActor<TMultiplyActionEnvelope | TSumResultEnvelope, TMultiplyResultEnvelope | TSumActionEnvelope>(
        'MULTIPLY',
        ({ subscribe, unsubscribe, dispatch }) => {
            subscribe(async (envelope) => {
                console.log('>>', envelope);
                if (envelope.type === MULTIPLY_ACTION_TYPE) {
                    const numbers = envelope.payload;
                    let result = numbers[0];

                    for (let i = 1; i < numbers.length; i++) {
                        dispatch(createEnvelope(SUM_ACTION_TYPE, Array(numbers[i]).fill(result)));
                        result = await new Promise<number>((r) => {
                            const cb = (envelope: TEnvelope<any, any>) => {
                                if (envelope.type === SUM_RESULT_TYPE) {
                                    unsubscribe(cb);
                                    r(envelope.payload);
                                }
                            };
                            subscribe(cb);
                        });
                    }

                    responseFactory(dispatch, envelope)(createEnvelope(MULTIPLY_RESULT_TYPE, result));
                }
            });
        },
    );
}
