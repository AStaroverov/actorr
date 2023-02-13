import {TActorContext, TAnyEnvelope, TDispatcher, TSubscriber} from "../types";
import {requestFactory} from "../request";
import {createResponseFactory} from "../response";
import {noop} from "../utils";

export function openChannelFactory<_In extends TAnyEnvelope, _Out extends TAnyEnvelope>(context: TActorContext<_In, _Out>) {
    const request = requestFactory(context);
    const createResponse = createResponseFactory(context.dispatch);

    return function openChannel<In extends _In, Out extends _Out>
    (envelope: _Out, onOpen: (dispatch: TDispatcher<Out>, close: VoidFunction) => TSubscriber<In>) {
        const map = new Map<string, TSubscriber<In>>();
        const closeAll = request(envelope, (envelope) => {
            const channelRoute = envelope.routePassed;

            if (channelRoute === undefined) {
                return;
            }

            if (!map.has(channelRoute)) {
                const close = () => map.set(channelRoute, noop);
                const response = createResponse(envelope);
                const subscriber = onOpen(response, close);

                map.set(channelRoute, subscriber);
            }

            const subscriber = map.get(channelRoute)!;

            subscriber(envelope as In);
        })

        return closeAll;
    }
}