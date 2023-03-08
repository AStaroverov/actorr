import { createActor } from '../common/actors/createActor';
import { MULTIPLY_ACTION_TYPE, TMultiplyActionEnvelope, TMultiplyResultEnvelope } from '../common/actors/multiply/defs';
import { createEnvelope, createRequest } from '../../main';
import { TLaunchEnvelope } from '../common/defs';
import { TAnyEnvelope } from '../../src/types';

export function createActorMain() {
    return createActor<TLaunchEnvelope | TMultiplyResultEnvelope, TMultiplyActionEnvelope>('MAIN', (context) => {
        const arr = Math.random() > 0.5 ? [3, 4, 5] : [2, 3, 5];
        const request = createRequest(context);
        const unsubscribe = request(createEnvelope(MULTIPLY_ACTION_TYPE, arr), (envelope: TAnyEnvelope) => {
            unsubscribe();
            console.log('>> result', envelope.payload, arr);
        });
    });
}
