import {
    TActorContext,
    TAnyEnvelope,
    TDispatch,
    TSubscribe,
} from "../types";
import {requestFactory} from "../request";
import {createResponseFactory} from "../response";
import {CHANNEL_CLOSE_TYPE, TChannelCloseEnvelope} from "./defs";
import {createEnvelope} from "../envelope";
import {noop, once} from "../utils";
import {TOpenChanelContext} from "./types";

export function openChannelFactory<_In extends TAnyEnvelope, _Out extends TAnyEnvelope>(context: TActorContext<_In, _Out>) {
    const request = requestFactory(context);
    const createResponse = createResponseFactory(context.dispatch);

    return function openChannel<In extends _In, Out extends _Out>(
        envelope: _Out,
        onOpen: (context: TOpenChanelContext<In, Out>) => void | Function
    ) {
        const mapClose = new Map<string, Function>();
        const mapDispose = new Map<string, Function>();

        const createCloseChannel = (route: string, dispatch: TDispatch<Out>) =>
            once(() => {
                mapDispose.has(route) && mapDispose.get(route)!();

                mapClose.delete(route);
                mapDispose.delete(route);

                dispatch(createEnvelope(CHANNEL_CLOSE_TYPE, undefined));
            });

        const createSubscribeToChannel = (route: string): TSubscribe<In> =>
            (callback, withSystemEnvelopes) =>
                context.subscribe(
                    (envelope) => envelope.routePassed === route && callback(envelope as In),
                    withSystemEnvelopes
                );


        const closeRequestResponse = request<_Out, In>(envelope, (envelope: TChannelCloseEnvelope) => {
            const channelRoute = envelope.routePassed;

            if (channelRoute === undefined) {
                return;
            }

            if (envelope.type === CHANNEL_CLOSE_TYPE) {
                mapClose.has(channelRoute) && mapClose.get(channelRoute)!();
                return;
            }

            if (!mapDispose.has(channelRoute)) {
                const dispatch = createResponse(envelope);
                const subscribe = createSubscribeToChannel(channelRoute);
                const close = createCloseChannel(channelRoute, dispatch);
                const dispose = onOpen({dispatch, subscribe, close});

                mapClose.set(channelRoute, close);
                mapDispose.set(channelRoute, dispose ?? noop);
            }
        })

        return function closeOpenedChannels() {
            closeRequestResponse();

            for (const close of mapClose.values()) {
                close();
            }

            mapClose.clear();
            mapDispose.clear();
        }
    }
}