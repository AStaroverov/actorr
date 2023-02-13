import type {TSumActionEnvelope, TSumResultEnvelope} from "../sum/defs";
import type {TMinMaxActionEnvelope, TMinMaxResultEnvelope} from "../minmax/defs";

import {createActor} from "../createActor";
import {connectActorToActor, TActor} from "../../../../main";
import {TLaunchEnvelope} from "../../defs";
import {TAnyEnvelope} from "../../../../src/types";

export function createEmptyActor(createdNestedActors: () => TActor<TAnyEnvelope, TAnyEnvelope>[]) {
    return createActor<
        TLaunchEnvelope | TSumResultEnvelope | TMinMaxResultEnvelope,
        TSumActionEnvelope | TMinMaxActionEnvelope
    >('NESTING', (context) => {
        const actors = createdNestedActors();
        const disconnects = actors.map(connectActorToActor.bind(null, context));

        return () => disconnects.forEach((d) => d());
    })
}
