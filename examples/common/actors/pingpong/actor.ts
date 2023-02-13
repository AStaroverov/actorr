import {createActor} from "../createActor";
import {TPongEnvelope,TPingEnvelope,TOpenChannelEnvelope,PONG_TYPE,PING_TYPE,OPEN_CHANNEL_TYPE} from "./defs";
import {supportChannelFactory} from "../../../../src/channel/supportChannelFactory";
import {createEnvelope} from "../../../../main";

export function createPingPongActor(delay: number) {
    return createActor<
        TPongEnvelope|TOpenChannelEnvelope,
        TPingEnvelope
    >('PING_PONG', (context) => {
        const supportChannel = supportChannelFactory(context);

        context.subscribe((envelope) => {
            if (envelope.type === OPEN_CHANNEL_TYPE) {
                console.log('>>',envelope)
                supportChannel<TPongEnvelope, TPingEnvelope>(envelope, (dispatch) => {
                    dispatch(createEnvelope(PING_TYPE, envelope.payload + 1))

                    return (envelope) => {
                        console.log('>>', delay, envelope.type, envelope.payload)
                        setTimeout(() => dispatch(createEnvelope(PING_TYPE, envelope.payload + 1)), delay);
                    }
                })
            }
        })
    })
}
