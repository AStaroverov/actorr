import type { TSumActionEnvelope, TSumResultEnvelope } from '../sum/defs';
import type { TMinMaxActionEnvelope, TMinMaxResultEnvelope } from '../minmax/defs';

import { createActor } from '../createActor';
import { Actor, connectActorToActor } from '../../../../src';

export function createEmptyActor(createdNestedActors: () => Actor[]) {
    return createActor<TSumResultEnvelope | TMinMaxResultEnvelope, TSumActionEnvelope | TMinMaxActionEnvelope>(
        'NESTING',
        (context) => {
            const actors = createdNestedActors();
            const disconnects = actors.map(connectActorToActor.bind(null, context));

            return () => disconnects.forEach((d) => d());
        },
    );
}
