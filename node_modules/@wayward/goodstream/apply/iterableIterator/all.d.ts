import Stream from "../../Stream";
interface StreamMethodsBuiltinOmitted<T> {
    filter2: Stream<T>["filter2"];
    filterNullish: Stream<T>["filterNullish"];
    filterFalsey: Stream<T>["filterFalsey"];
    takeWhile: Stream<T>["takeWhile"];
    takeUntil: Stream<T>["takeUntil"];
    dropWhile: Stream<T>["dropWhile"];
    dropUntil: Stream<T>["dropUntil"];
    step: Stream<T>["step"];
    sort: Stream<T>["sort"];
    sortBy: Stream<T>["sort"];
    reverse: Stream<T>["reverse"];
    distinct: Stream<T>["distinct"];
    shuffle: Stream<T>["shuffle"];
    partition: Stream<T>["partition"];
    unzip: Stream<T>["unzip"];
    add: Stream<T>["add"];
    merge: Stream<T>["merge"];
    insert: Stream<T>["insert"];
    insertAt: Stream<T>["insertAt"];
    collectStream: Stream<T>["collectStream"];
    entries: Stream<T>["entries"];
    any: Stream<T>["any"];
    all: Stream<T>["all"];
    none: Stream<T>["none"];
    includes: Stream<T>["includes"];
    contains: Stream<T>["contains"];
    has: Stream<T>["has"];
    includesAll: Stream<T>["includesAll"];
    containsAll: Stream<T>["containsAll"];
    hasAll: Stream<T>["hasAll"];
    intersects: Stream<T>["intersects"];
    count: Stream<T>["count"];
    length: Stream<T>["length"];
    size: Stream<T>["size"];
    fold: Stream<T>["fold"];
    first: Stream<T>["first"];
    last: Stream<T>["last"];
    at: Stream<T>["at"];
    random: Stream<T>["random"];
    collect: Stream<T>["collect"];
    splat: Stream<T>["splat"];
    race: Stream<T>["race"];
    rest: Stream<T>["rest"];
    toSet: Stream<T>["toSet"];
    toMap: Stream<T>["toMap"];
    toObject: Stream<T>["toObject"];
    toString: Stream<T>["toString"];
    min: Stream<T>["min"];
    max: Stream<T>["max"];
    iterateToEnd: Stream<T>["iterateToEnd"];
    finish: Stream<T>["finish"];
    end: Stream<T>["end"];
    complete: Stream<T>["complete"];
    flush: Stream<T>["flush"];
    splatEach: Stream<T>["splatEach"];
    hasNext: Stream<T>["hasNext"];
}
declare global {
    interface IterableIterator<T> extends StreamMethodsBuiltinOmitted<T> {
    }
    interface IteratorObject<T> extends StreamMethodsBuiltinOmitted<T> {
    }
    interface Generator<T> extends StreamMethodsBuiltinOmitted<T> {
    }
}
export {};
