import {TActorContext, TAnyEnvelope, TDispatcher, TSubscriber} from "../types";
import {createResponseFactory} from "../response";
import {getShortRandomString} from "../utils";

function createChannelName() {
    return `Channel(${getShortRandomString()})`;
}

export function supportChannelFactory<_In extends TAnyEnvelope, _Out extends TAnyEnvelope>(
    context: TActorContext<_In, _Out>,
) {
    const createResponse = createResponseFactory(context.dispatch);

    return function supportChannel<In extends _In, Out extends _Out>
    (target: _In, support: (dispatch: TDispatcher<Out>) => void | TSubscriber<In>) {
        const name = createChannelName();
        const response = createResponse(target, name);
        const subscriber = support(response);
        const isChannelEnvelop = (envelope: _In): envelope is In => {
            return envelope.routePassed!.startsWith(name);
        }
        const subscriberWrapper = (envelope: _In) => {
            if (isChannelEnvelop(envelope)) (subscriber as TSubscriber<In>)(envelope);
        }

        typeof subscriber === 'function' && context.subscribe(subscriberWrapper);

        return () => typeof subscriber === 'function' && context.unsubscribe(subscriberWrapper);
    }

}
