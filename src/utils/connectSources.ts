import type {TSource, TSourceWithMapper} from "./types";
import type {TAnyEnvelope, TEnvelope} from "../types";
import {getMapper, getSource, getSourceName} from "./index";
import {subscribe} from "./subscribe";
import {dispatch} from "./dispatch";
import {extendRoute, reduceRoute, routeEndsWith} from "./route";
import {shallowCopyEnvelope} from "../envelope";

export function connectSources<S1 extends TSource, S2 extends TSource>(
    _source1: S1 | TSourceWithMapper<S1>,
    _source2: S2 | TSourceWithMapper<S2>
) {
    const source1 = getSource(_source1);
    const source2 = getSource(_source2);
    const mapper1 = getMapper(_source1);
    const mapper2 = getMapper(_source2);
    const name1 = getSourceName(source1);
    const name2 = getSourceName(source2);

    const messageTransfer1 = createMessageTransfer(name1, mapper1, name2, source2);
    const messageTransfer2 = createMessageTransfer(name2, mapper2, name1, source1);

    const unsub1 = subscribe(source1, messageTransfer1);
    const unsub2 = subscribe(source2, messageTransfer2);

    return () => {
        unsub1();
        unsub2();
    }
}

function createMessageTransfer(
    sourceName: string,
    sourceMapper: (envelope: TAnyEnvelope) => undefined | TAnyEnvelope,
    targetName: string,
    target: TSource,
) {
    return function messageTransfer(_envelope: TEnvelope<any, any>) {
        const envelope = sourceMapper(_envelope);

        if (envelope === undefined) return;

        const isCorrectRoute = hasCorrectRoute(envelope, targetName);

        if (!isCorrectRoute) return;

        const copy = shallowCopyEnvelope(envelope);

        copy.routePassed = extendPassedPart(copy, sourceName);
        copy.routeAnnounced = reduceAnnouncedPart(copy, targetName);

        try {
            dispatch(target, copy);
        } catch (err) {
            console.error(err);
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
    return envelope.routeAnnounced === undefined
        ? undefined
        : reduceRoute(envelope.routeAnnounced, part);
}