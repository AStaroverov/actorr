import { onConnectMessagePort, connectMessagePortToActor, getMessagePortName } from '../../../main';
import { createActorMultiply } from '../actors/multiply/actor';
import { MULTIPLY_ACTION_TYPE, MULTIPLY_RESULT_TYPE } from '../actors/multiply/defs';
import { SUM_ACTION_TYPE, SUM_RESULT_TYPE } from '../actors/sum/defs';

const actor = createActorMultiply().launch();

onConnectMessagePort((name) => {
    if (getMessagePortName('MAIN') === name) {
        return connectMessagePortToActor(
            {
                ref: name,
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
                ref: actor,
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

    if (getMessagePortName('SUM_WORKER') === name) {
        return connectMessagePortToActor(
            {
                ref: name,
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
                ref: actor,
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
