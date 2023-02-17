import {TActorContext, TAnyEnvelope, TDispatcher, TSubscribeCallback, TSubscriber} from "../types";
import {requestFactory} from "../request";
import {createResponseFactory} from "../response";
import {CHANNEL_CLOSE_TYPE, TChannelCloseEnvelope} from "./defs";
import {createEnvelope} from "../envelope";
import {noop, once} from "../utils";
import {createSubscribe} from "../utils/subscribe";
import {isSystemEnvelope} from "../utils/isSystemEnvelope";

export function openChannelFactory<_In extends TAnyEnvelope, _Out extends TAnyEnvelope>(context: TActorContext<_In, _Out>) {
    const request = requestFactory(context);
    const createResponse = createResponseFactory(context.dispatch);
    const subscribeToContext = createSubscribe(context);

    return function openChannel<In extends _In, Out extends _Out>(
        envelope: _Out,
        onOpen: (dispatch: TDispatcher<Out>, subscribe: TSubscriber<In>, close: VoidFunction) => void | Function
    ) {
        const closeMap = new Map<string, Function>();
        const disposeMap = new Map<string, Function>();

        const createCloseChannel = (route: string, dispatch: TDispatcher<Out>) =>
            once(() => {
                disposeMap.has(route) && disposeMap.get(route)!();

                closeMap.delete(route);
                disposeMap.delete(route);

                dispatch(createEnvelope(CHANNEL_CLOSE_TYPE, undefined));
            });

        const createSubscribeToChannel = (route: string) =>
            (callback: TSubscribeCallback<In>) =>
                subscribeToContext((envelope) => {
                    if (envelope.routePassed === route && !isSystemEnvelope(envelope)) callback(envelope as In)
                });


        const closeRequestResponse = request<_Out, In>(envelope, (envelope: TChannelCloseEnvelope) => {
            const channelRoute = envelope.routePassed;

            if (channelRoute === undefined) {
                return;
            }

            if (envelope.type === CHANNEL_CLOSE_TYPE && disposeMap.has(channelRoute)) {
                closeMap.has(channelRoute) && closeMap.get(channelRoute)!();
                return;
            }

            if (!disposeMap.has(channelRoute)) {
                const dispatch = createResponse(envelope);
                const subscribe = createSubscribeToChannel(channelRoute)
                const closeChannel = createCloseChannel(channelRoute, dispatch)
                const disposeChannel = onOpen(dispatch, subscribe, closeChannel);

                closeMap.set(channelRoute, closeChannel);
                disposeMap.set(channelRoute, disposeChannel ?? noop);
            }
        })

        return function closeOpenedChannels() {
            console.log('>> close all',)
            closeRequestResponse();

            for (const close of closeMap.values()) {
                close();
            }

            closeMap.clear();
            disposeMap.clear();
        }
    }
}