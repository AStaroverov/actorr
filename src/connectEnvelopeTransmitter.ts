import type { AnyEnvelope, Envelope, EnvelopeTransmitter, EnvelopeTransmitterWithMapper } from './types';
import { getEnvelopeTransmitter, getTransmitterMapper, getTransmitterName } from './utils';
import { subscribe } from './subscribe';
import { createDispatch } from './dispatch';
import { extendRoute, reduceRoute, routeEndsWith } from './route';
import { shallowCopyEnvelope } from './envelope';
import { isSystemEnvelope } from './isSystemEnvelope';

export function connectEnvelopeTransmitter<T1 extends EnvelopeTransmitter, T2 extends EnvelopeTransmitter>(
    _transmitter1: T1 | EnvelopeTransmitterWithMapper<T1>,
    _transmitter2: T2 | EnvelopeTransmitterWithMapper<T2>,
): Function {
    const transmitter1 = getEnvelopeTransmitter(_transmitter1);
    const transmitter2 = getEnvelopeTransmitter(_transmitter2);
    const mapper1 = getTransmitterMapper(_transmitter1);
    const mapper2 = getTransmitterMapper(_transmitter2);
    const name1 = getTransmitterName(transmitter1);
    const name2 = getTransmitterName(transmitter2);
    const unsub1 = subscribe(transmitter1, createRedispatch(name1, mapper1, name2, transmitter2), true);
    const unsub2 = subscribe(transmitter2, createRedispatch(name2, mapper2, name1, transmitter1), true);

    return () => {
        unsub1();
        unsub2();
    };
}

function createRedispatch(
    sourceName: string,
    sourceMapper: (envelope: AnyEnvelope) => undefined | AnyEnvelope,
    targetName: string,
    target: EnvelopeTransmitter,
) {
    const dispatch = createDispatch(target);
    return function redispatch(_envelope: Envelope<any, any>) {
        const envelope = isSystemEnvelope(_envelope) ? _envelope : sourceMapper(_envelope);

        if (envelope === undefined) return;

        const isCorrectRoute = hasCorrectRoute(envelope, targetName);

        if (!isCorrectRoute) return;

        const copy = shallowCopyEnvelope(envelope);

        copy.routePassed = extendPassedPart(copy, sourceName);
        copy.routeAnnounced = reduceAnnouncedPart(copy, targetName);

        try {
            dispatch(copy);
        } catch (err) {
            console.error(err);
        }
    };
}

function hasCorrectRoute(envelope: AnyEnvelope, part: string) {
    return envelope.routeAnnounced === undefined || routeEndsWith(envelope.routeAnnounced, part);
}

function extendPassedPart(envelope: AnyEnvelope, part: string) {
    return extendRoute(envelope.routePassed ?? '', part);
}

function reduceAnnouncedPart(envelope: AnyEnvelope, part: string) {
    return envelope.routeAnnounced === undefined ? undefined : reduceRoute(envelope.routeAnnounced, part);
}
