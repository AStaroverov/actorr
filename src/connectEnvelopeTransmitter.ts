import type { TAnyEnvelope, TEnvelope, TEnvelopeTransmitterWithMapper, TEnvelopeTransmitter } from './types';
import { getMapper, getEnvelopeTransmitter, getName } from './utils';
import { createSubscribe } from './subscribe';
import { dispatch } from './dispatch';
import { extendRoute, reduceRoute, routeEndsWith } from './route';
import { shallowCopyEnvelope } from './envelope';
import { isSystemEnvelope } from './isSystemEnvelope';

export function connectEnvelopeTransmitter<T1 extends TEnvelopeTransmitter, T2 extends TEnvelopeTransmitter>(
    _transmitter1: T1 | TEnvelopeTransmitterWithMapper<T1>,
    _transmitter2: T2 | TEnvelopeTransmitterWithMapper<T2>,
): Function {
    const transmitter1 = getEnvelopeTransmitter(_transmitter1);
    const transmitter2 = getEnvelopeTransmitter(_transmitter2);
    const mapper1 = getMapper(_transmitter1);
    const mapper2 = getMapper(_transmitter2);
    const name1 = getName(transmitter1);
    const name2 = getName(transmitter2);
    const unsub1 = createSubscribe(transmitter1)(createRedispatch(name1, mapper1, name2, transmitter2), true);
    const unsub2 = createSubscribe(transmitter2)(createRedispatch(name2, mapper2, name1, transmitter1), true);

    return () => {
        unsub1();
        unsub2();
    };
}

function createRedispatch(
    sourceName: string,
    sourceMapper: (envelope: TAnyEnvelope) => undefined | TAnyEnvelope,
    targetName: string,
    target: TEnvelopeTransmitter,
) {
    return function redispatch(_envelope: TEnvelope<any, any>) {
        const envelope = isSystemEnvelope(_envelope) ? _envelope : sourceMapper(_envelope);

        if (envelope === undefined) return;

        const isCorrectRoute = hasCorrectRoute(envelope, targetName);

        if (!isCorrectRoute) return;

        const copy = shallowCopyEnvelope(envelope);

        copy.routePassed = extendPassedPart(copy, sourceName);
        copy.routeAnnounced = reduceAnnouncedPart(copy, targetName);

        try {
            dispatch(target, copy);
        } catch (err) {
            console.error(new Error('Error on dispatch envelope', { cause: err }));
        }
    };
}

function hasCorrectRoute(envelope: TAnyEnvelope, part: string) {
    return envelope.routeAnnounced === undefined || routeEndsWith(envelope.routeAnnounced, part);
}

function extendPassedPart(envelope: TAnyEnvelope, part: string) {
    return extendRoute(envelope.routePassed ?? '', part);
}

function reduceAnnouncedPart(envelope: TAnyEnvelope, part: string) {
    return envelope.routeAnnounced === undefined ? undefined : reduceRoute(envelope.routeAnnounced, part);
}
