import type { TSumActionEnvelope, TSumResultEnvelope } from '../sum/defs';
import type { TMinMaxActionEnvelope, TMinMaxResultEnvelope } from '../minmax/defs';

import { createActor } from '../createActor';
import { connectActorToActor, TActor } from '../../../../main';
import { TLaunchEnvelope } from '../../defs';

export function createEmptyActor(createdNestedActors: () => TActor[]) {
    return createActor<
        TLaunchEnvelope | TSumResultEnvelope | TMinMaxResultEnvelope,
        TSumActionEnvelope | TMinMaxActionEnvelope
    >('NESTING', (context) => {
        const actors = createdNestedActors();
        const disconnects = actors.map(connectActorToActor.bind(null, context));

        return () => disconnects.forEach((d) => d());
    });
}
