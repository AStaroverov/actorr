import { EnvelopeTransmitter, ExtractEnvelopeIn, ExtractEnvelopeOut, Subscribe, ValueOf } from '../types';
import { createRequest } from '../request/request';
import { CHANNEL_CLOSE_TYPE, CHANNEL_HANDSHAKE_TYPE, CHANNEL_READY_TYPE, ChannelCloseReason } from './defs';
import { ChannelDispose, OpenChanelContext } from './types';
import { createSubscribe } from '../subscribe';
import { createDeferredDispatch } from '../dispatch';
import { createEnvelope, shallowCopyEnvelope } from '../envelope';
import { createShortRandomString } from '../utils/common';
import { lock, subscribeOnUnlock } from '../utils/Locks';
import { timeoutProvider } from '../providers';
import { createResponseFactory } from '../request/response';
import { Defer } from '../utils/Defer';
import { sleep } from '../utils';

export function openChannelFactory<T extends EnvelopeTransmitter>(transmitter: T) {
    const request = createRequest(transmitter);
    const subscribe = createSubscribe(transmitter);

    return function openChannel<In extends ExtractEnvelopeIn<T>, Out extends ExtractEnvelopeOut<T>>(
        envelope: ExtractEnvelopeOut<T>,
        onOpen: (context: OpenChanelContext<In, Out>) => void | ChannelDispose,
        options?: {
            timeout?: {
                first: number;
                callback: VoidFunction;
            };
        },
    ) {
        const copy = shallowCopyEnvelope(envelope);
        copy.uniqueId = createShortRandomString();

        const mapDispose = new Map<string, Function>();

        const createCloseChannel = (id: string) => (reason: ValueOf<typeof ChannelCloseReason>) => {
            mapDispose.get(id)?.(reason);
            mapDispose.delete(id);
        };
        const closeAllChannels = () => {
            for (const dispose of mapDispose.values()) {
                dispose(ChannelCloseReason.ManualByOpener);
            }
            mapDispose.clear();
        };

        const unlockRequestSide = lock(copy.uniqueId);
        const closeResponseSubscription = request(
            copy,
            (responseEnvelope) => {
                if (responseEnvelope.type !== CHANNEL_HANDSHAKE_TYPE) return;

                const channelId = responseEnvelope.payload;
                const routePassed = responseEnvelope.routePassed!;

                if (mapDispose.has(channelId)) return;

                const channelReady = new Defer();
                const createResponse = createResponseFactory(createDeferredDispatch(transmitter, channelReady.promise));
                const closeChannel = createCloseChannel(channelId);
                const dispatchToChannel = createResponse(responseEnvelope);
                const subscribeToChannel: Subscribe<In> = (callback, withSystemEnvelopes) => {
                    return subscribe((envelope) => {
                        if (envelope.routePassed === routePassed) {
                            callback(envelope as In);
                        }
                    }, withSystemEnvelopes);
                };

                const unsubscribeOnReady = subscribeToChannel((envelope) => {
                    if (envelope.type === CHANNEL_READY_TYPE) {
                        channelReady.resolve(undefined);
                        unsubscribeOnReady();
                    }
                }, true);
                const unsubscribeOnCloseChannel = subscribeToChannel((envelope) => {
                    return envelope.type === CHANNEL_CLOSE_TYPE && closeChannel(ChannelCloseReason.ManualBySupporter);
                }, true);
                const unsubscribeOnChannelTerminate = subscribeOnUnlock(channelId, () => {
                    // close message can be in browser queue, so we need to wait a little
                    timeoutProvider.setTimeout(() => closeChannel(ChannelCloseReason.LoseChannel), 1000);
                });
                const dispose = onOpen({
                    dispatch: dispatchToChannel,
                    subscribe: subscribeToChannel,
                    close: () => closeChannel(ChannelCloseReason.ManualByOpener),
                });

                mapDispose.set(channelId, (reason: ValueOf<typeof ChannelCloseReason>) => {
                    unsubscribeOnChannelTerminate();
                    unsubscribeOnCloseChannel();
                    unsubscribeOnReady();
                    dispose?.(reason);

                    if (reason === ChannelCloseReason.ManualByOpener) {
                        Promise.race([channelReady.promise, sleep(1000)]).then(() => {
                            dispatchToChannel(createEnvelope(CHANNEL_CLOSE_TYPE, undefined));
                        });
                    }
                });

                dispatchToChannel(createEnvelope(CHANNEL_READY_TYPE, undefined));
            },
            options,
        );

        return function closeOpenedChannels() {
            closeResponseSubscription();
            closeAllChannels();
            timeoutProvider.setTimeout(unlockRequestSide, 1000);
        };
    };
}
