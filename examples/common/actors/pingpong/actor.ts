import {createActor} from "../createActor";
import {TPongEnvelope,TPingEnvelope,TOpenChannelEnvelope,PING_TYPE,OPEN_CHANNEL_TYPE} from "./defs";
import {supportChannelFactory} from "../../../../src/channel/supportChannelFactory";
import {createEnvelope} from "../../../../main";
import {createHeartbeat} from "../../../../src/heartbeat";

export function createPingPongActor(delay: number) {
    return createActor<
        TPongEnvelope|TOpenChannelEnvelope,
        TPingEnvelope
    >('PING_PONG', (context) => {
        const supportChannel = supportChannelFactory(context);

        context.subscribe((envelope) => {
            if (envelope.type === OPEN_CHANNEL_TYPE) {
                console.log('>>',envelope)
                const close = supportChannel<TPongEnvelope, TPingEnvelope>(envelope, (ctx) => {
                    ctx.dispatch(createEnvelope(PING_TYPE, envelope.payload + 1));

                    const closePing = createHeartbeat('PING_PONG', ctx, () => {
                        console.log('>> PANIC PING_PONG CHANNEL')
                    });
                    const closeReaction = ctx.subscribe((envelope) => {
                        console.log('>>', delay, envelope.type, envelope.payload)
                        setTimeout(() => ctx.dispatch(createEnvelope(PING_TYPE, envelope.payload + 1)), delay);
                    });

                    return () => {
                        closePing();
                        closeReaction();
                    }
                })
            }
        })
    })
}
