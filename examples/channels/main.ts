import {connectActorToActor} from "../../main";
import {createActorMain} from "./actor";
import {createEmptyActor} from "../common/actors/empty/actor";
import {createRandomActor} from "../common/actors/random/actor";
import {createPingPongActor} from "../common/actors/pingpong/actor";

const actorMain = createActorMain();
const actorEmpty = createEmptyActor(
    () => [createEmptyActor(() => [
        createRandomActor().launch(),
        createPingPongActor(1000).launch(),
        createPingPongActor(5000).launch(),
    ]).launch()
]).launch();

connectActorToActor(actorMain, actorEmpty);

setTimeout(() => actorMain.launch(), 100);

