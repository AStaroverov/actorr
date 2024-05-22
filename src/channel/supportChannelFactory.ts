import { EnvelopeTransmitter, ExtractEnvelopeIn, ExtractEnvelopeOut, Subscribe, ValueOf } from '../types';
import type { ChannelDispose, SupportChanelContext } from './types';
import { createResponseFactory } from '../request/response';
import { CHANNEL_CLOSE_TYPE, CHANNEL_HANDSHAKE_TYPE, CHANNEL_READY_TYPE, ChannelCloseReason } from './defs';
import { createDeferredDispatch } from '../dispatch';
import { createSubscribe } from '../subscribe';
import { createShortRandomString, noop } from '../utils/common';
import { lock, subscribeOnUnlock } from '../utils/Locks';
import { timeoutProvider } from '../providers';
import { createEnvelope } from '../envelope';
import { Defer } from '../utils/Defer';
import { sleep } from '../utils';

export function supportChannelFactory<T extends EnvelopeTransmitter>(transmitter: T) {
    const subscribe = createSubscribe(transmitter);

    return function supportChannel<In extends ExtractEnvelopeIn<T>, Out extends ExtractEnvelopeOut<T>>(
        target: ExtractEnvelopeIn<T>,
        onOpen: (context: SupportChanelContext<In, Out>) => void | ChannelDispose,
    ) {
        if (target.routePassed === undefined) throw new Error('This envelope cannot be used to support a channel');

        const channelReady = new Defer();
        const channelId = createShortRandomString();
        const handshakeEnvelope = createEnvelope(CHANNEL_HANDSHAKE_TYPE, channelId);
        const unlockResponseSide = lock(channelId);
        const createResponse = createResponseFactory(createDeferredDispatch(transmitter, channelReady.promise));
        const dispatchToChannel = createResponse<Out>(target);

        const subscribeToChannel: Subscribe<In> = (callback, withSystemEnvelopes) => {
            return subscribe((envelope) => {
                if (envelope.routeAnnounced?.startsWith(dispatchToChannel.responseName)) {
                    callback(envelope as In);
                }
            }, withSystemEnvelopes);
        };

        let closeChannel: (reason: ValueOf<typeof ChannelCloseReason>) => void;

        const unsubscribeOnReady = subscribeToChannel((envelope) => {
            if (envelope.type === CHANNEL_READY_TYPE) {
                channelReady.resolve(undefined);
                unsubscribeOnReady();
            }
        }, true);
        const unsubscribeOnCloseChannel = subscribeToChannel(
            (envelope) => envelope.type === CHANNEL_CLOSE_TYPE && closeChannel(ChannelCloseReason.ManualByOpener),
            true,
        );
        const unsubscribeOnChannelTerminate = subscribeOnUnlock(target.uniqueId, () => {
            // close message can be in browser queue, so we need to wait a little
            timeoutProvider.setTimeout(() => closeChannel(ChannelCloseReason.LoseChannel), 1000);
        });

        dispatchToChannel(handshakeEnvelope);

        const dispose = onOpen({ dispatch: dispatchToChannel, subscribe: subscribeToChannel });

        closeChannel = (reason: ValueOf<typeof ChannelCloseReason>) => {
            closeChannel = noop;

            unsubscribeOnChannelTerminate();
            unsubscribeOnCloseChannel();
            unsubscribeOnReady();
            dispose?.(reason);

            if (reason === ChannelCloseReason.ManualBySupporter) {
                Promise.race([channelReady.promise, sleep(1000)]).then(() => {
                    dispatchToChannel(createEnvelope(CHANNEL_CLOSE_TYPE, undefined) as Out);
                });
            }

            timeoutProvider.setTimeout(unlockResponseSide, 1000);
        };

        dispatchToChannel(createEnvelope(CHANNEL_READY_TYPE, undefined) as Out);

        return () => {
            closeChannel(ChannelCloseReason.ManualBySupporter);
        };
    };
}
