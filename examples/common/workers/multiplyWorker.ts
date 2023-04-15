import { connectMessagePortToActor, onConnectMessagePort } from '../../../src';
import { createActorMultiply } from '../actors/multiply/actor';
import { MULTIPLY_ACTION_TYPE, MULTIPLY_RESULT_TYPE } from '../actors/multiply/defs';
import { SUM_ACTION_TYPE, SUM_RESULT_TYPE } from '../actors/sum/defs';

const actor = createActorMultiply().launch();

onConnectMessagePort(self as DedicatedWorkerGlobalScope | SharedWorkerGlobalScope, (name, port) => {
    if (name.includes('MAIN')) {
        return connectMessagePortToActor(
            {
                transmitter: port,
                map: (envelope) => {
                    switch (envelope.type) {
                        case MULTIPLY_ACTION_TYPE:
                            return envelope;
                        default:
                            return undefined;
                    }
                },
            },
            {
                transmitter: actor,
                map: (envelope) => {
                    switch (envelope.type) {
                        case MULTIPLY_RESULT_TYPE:
                            return envelope;
                        default:
                            return undefined;
                    }
                },
            },
        );
    }

    if (name.includes('SUM_WORKER')) {
        return connectMessagePortToActor(
            {
                transmitter: port,
                map: (envelope) => {
                    switch (envelope.type) {
                        case SUM_RESULT_TYPE:
                            return envelope;
                        default:
                            return undefined;
                    }
                },
            },
            {
                transmitter: actor,
                map: (envelope) => {
                    switch (envelope.type) {
                        case SUM_ACTION_TYPE:
                            return envelope;
                        default:
                            return undefined;
                    }
                },
            },
        );
    }
});
