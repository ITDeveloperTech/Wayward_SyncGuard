import Partitions from "./Partitions";
import UnzippedPartitions from "./UnzippedPartitions";
type Flat1<T> = T extends Iterable<infer X> ? X | Extract<T, string> | Exclude<T, Iterable<any>> : never;
type Key<T> = T extends [infer K, any] ? K : T extends readonly [infer K2, any] ? K2 : never;
type Value<T> = T extends [any, infer V] ? V : T extends readonly [any, infer V2] ? V2 : never;
type Unary<T, R = void> = (arg: T) => R;
/**
 * Note: When "splatting" a stream, it's actually faster (but not by much) to first collect it into an array:
 * ```ts
 * // slower
 * [...Stream.range(10)]
 *
 * // faster
 * [...Stream.range(10).toArray()]
 * ```
 */
interface Stream<T> extends Iterator<T>, Iterable<T> {
    done: boolean;
    value: T;
    [Symbol.iterator](): Iterator<T>;
    [Symbol.asyncIterator](): AsyncIterableIterator<T extends Promise<infer R> ? R : never>;
    /**
     * Returns a Stream that will loop only over the entries that match the given filter
     * @param filter A function that returns a truthy value if the entry should be included and a falsey value if it shouldn't
     *
     * Note: The only difference between this method and `filter2` is the type argument: This method excludes the type argument,
     * while the other returns it.
     */
    filter<R extends T>(filter?: (val: T, index: number) => val is R): Stream<R>;
    /**
     * Returns a Stream that will loop only over the entries that match the given filter
     * @param filter A function that returns a truthy value if the entry should be included and a falsey value if it shouldn't
     *
     * Note: The only difference between this method and `filter2` is the type argument: This method excludes the type argument,
     * while the other returns it.
     */
    filter<X = never>(filter?: (val: T, index: number) => any): Stream<Exclude<T, X>>;
    /**
     * Returns a Stream that will loop only over the entries that match the given filter
     * @param filter A function that returns a truthy value if the entry should be included and a falsey value if it shouldn't
     *
     * Note: The only difference between this method and `filter` is the type argument: This method returns the type argument,
     * while the other excludes it.
     */
    filter2<X = T>(filter?: (val: T, index: number) => any): Stream<X>;
    /**
     * Remove `undefined` and `null` values from the stream
     */
    filterNullish(): Stream<Exclude<T, undefined>>;
    /**
     * Remove all falsey values from the stream (does not filter out `0` and `""`)
     */
    filterFalsey(): Stream<Exclude<T, undefined | null | false>>;
    /**
     * Remove all falsey values from the stream, including `0` and `""`
     */
    filterFalsey(removeZeroAndEmptyString: true): Stream<Exclude<T, undefined | null | false | 0 | "">>;
    /**
     * Returns a Stream of type X, using the given mapper function
     * @param mapper A function that maps an entry of type T to its corresponding type X
     */
    map<X = T>(mapper?: (val: T, index: number) => X): Stream<X>;
    /**
     * Returns a new Stream iterating over each value of the current iterator, first run through the given mapper function.
     *
     * For example:
     * ```ts
     * [[1, 2, 3], [4, 5, 6]]
     * 	.flatMap(numberArray => numberArray
     * 		.map(num => num + 1))
     * // result: [2, 3, 4, 5, 6, 7]
     * ```
     */
    flatMap<X>(mapper: (value: T, index: number) => Iterable<X>): Stream<X>;
    /**
     * Returns a new Stream iterating over every value of each value of this iterator. The values in this
     * Stream must be iterable.
     */
    flatMap(): Stream<Flat1<T>>;
    /**
     * Returns a new Stream iterating over every value of each value of this Stream. The values in this
     * Stream must be iterable.
     */
    flatMap<X>(): Stream<X>;
    /**
     * Returns a Stream which will only go through the first X items, where X is the given argument.
     */
    take(amount: number): Stream<T>;
    /**
     * Returns a Stream which will only iterate through the items in this Stream until the predicate doesn't match.
     * @param predicate A predicate function that takes a Stream value and its index.
     */
    takeWhile(predicate: (val: T) => unknown): Stream<T>;
    /**
     * Returns a Stream which will only iterate through the items in this Stream until the predicate matches.
     * @param predicate A predicate function that takes a Stream value and its index.
     */
    takeUntil(predicate: (val: T) => unknown): Stream<T>;
    /**
     * Returns a Stream which will skip the first X items, where X is the given argument.
     */
    drop(amount: number): Stream<T>;
    /**
     * Returns a Stream which will skip the items in this Stream until the predicate doesn't match.
     * @param predicate A predicate function that takes a Stream value and its index.
     */
    dropWhile(predicate: (val: T) => unknown): Stream<T>;
    /**
     * Returns a Stream which will skip the items in this Stream until the predicate matches.
     * @param predicate A predicate function that takes a Stream value and its index.
     */
    dropUntil(predicate: (val: T) => unknown): Stream<T>;
    /**
     * Returns a Stream which steps through the items in the current Stream using the provided step amount.
     * @param step A non-zero integer. Positive integers will step forwards through the Stream, negative integers
     * will step backwards.
     *
     * Note: Stepping backwards will require iteration through this entire Stream.
     */
    step(step: number): Stream<T>;
    /**
     * Returns a new Stream which contains the sorted contents of this stream. Uses the same sort algorithm as native arrays.
     */
    sort(): Stream<T>;
    /**
     * Returns a new Stream which contains the sorted contents of this Stream.
     * @param comparator A function that returns a "difference" between `a` and `b`, for sorting by.
     */
    sort(comparator: ((a: T, b: T) => number) | false): Stream<T>;
    /**
     * Returns a new Stream which contains the sorted contents of this stream. Uses the same sort algorithm as native arrays over the value returned by `mapper`.
     * @param mapper The stream will be sorted as if these values are the stream values. The mapper will only be called once for each stream value.
     */
    sortBy(mapper: (value: T) => any): Stream<T>;
    /**
     * Returns a new Stream which contains the sorted contents of this stream. Uses the same sort algorithm as native arrays over the value returned by `mapper`.
     * @param mapper The stream will be sorted as if these values are the stream values. The mapper will only be called once for each stream value.
     */
    sortBy<M>(mapper: (value: T) => M, comparator: ((value1: M, value2: M) => number) | false): Stream<T>;
    /**
     * Returns a new Stream which contains the contents of this Stream, in reverse order.
     */
    reverse(): Stream<T>;
    /**
     * Returns a new Stream which contains only unique items in this Stream.
     *
     * Note: Alias of `Stream.from(stream.toSet())`
     */
    distinct(): Stream<T>;
    /**
     * Returns a new Stream of the shuffled items in this Stream.
     */
    shuffle(random?: () => number): Stream<T>;
    /**
     * Returns a `Partitions` instance which allows sorting items of this Stream into separate sub-streams, or "partitions".
     * @param sorter A function which takes an item in this Stream and maps it to the "key" of its partition.
     *
     * Example:
     * ```ts
     * Stream.of("dog", "horse", "cat", "pig", "goat", "chicken", "cow")
     * 	.partition(animal => animal.length) // splits the animal list into partitions by the length of their names
     * 	.get(3) // gets the partition of animals with 3 letter long names
     * 	.toArray(); // ["dog", "cat", "pig", "cow"]
     * ```
     */
    partition<K>(sorter: (val: T) => K): Partitions<T, K>;
    /**
     * Returns a `Partitions` instance which allows sorting items of this Stream into separate sub-streams, or "partitions".
     * @param sorter A function which takes an item in this Stream and maps it to the "key" of its partition.
     * @param mapper A function which takes an item in this Stream and maps it to its new value in the partition.
     */
    partition<K, V>(sorter: (val: T) => K, mapper: (val: T) => V): Partitions<T, K, V>;
    /**
     * Returns a `Partitions` instance where the T items (should be 2-value Tuples) of this Stream are split into two
     * partition Streams: "key" and "value".
     */
    unzip(): T extends [infer K, infer V] ? UnzippedPartitions<K, V> : never;
    /**
     * Returns a new Stream containing the items in this Stream and then the items provided.
     */
    add<N>(...items: N[]): Stream<T | N>;
    /**
     * Returns a new Stream containing the items in this Stream and then the items in all provided Streams or Iterables.
     */
    merge<N>(...iterables: (Stream<N> | Iterable<N>)[]): Stream<T | N>;
    /**
     * Inserts the given items into the beginning of this Stream.
     */
    insert<N>(...items: N[]): Stream<N | T>;
    /**
     * Inserts the given items at the given index of this Stream.
     */
    insertAt<N>(index: number, ...items: N[]): Stream<N | T>;
    /**
     * Returns a new Stream of the same type, after first collecting this Stream into an array.
     *
     * Why is this useful? It can be used, for example, to prevent concurrent modification errors. Since it collects
     * everything into an array before streaming the values, it allows doing things such as deletion from the source object.
     *
     * Note: This method is an alias of `Stream.from(stream.toArray())`.
     */
    collectStream(): Stream<T>;
    /**
     * Returns a new Stream of the values in this stream, and their index.
     */
    entries(): Stream<[number, T]>;
    /**
     * Returns true if the predicate returns true for any of the items in this Stream
     * @param predicate A predicate function that takes a Stream value and its index.
     */
    any(predicate: (val: T, index: number) => unknown): boolean;
    /**
     * Returns true if the predicate returns true for any of the items in this Stream
     * @param predicate A predicate function that takes a Stream value and its index.
     *
     * Note: Alias of `any()`
     */
    some(predicate: (val: T, index: number) => unknown): boolean;
    /**
     * Returns true if the predicate returns true for every item in the Stream
     * @param predicate A predicate function that takes a Stream value and its index.
     */
    every(predicate: (val: T, index: number) => unknown): boolean;
    /**
     * Returns true if the predicate returns true for every item in the Stream
     * @param predicate A predicate function that takes a Stream value and its index.
     *
     * Note: Alias of `every()`
     */
    all(predicate: (val: T, index: number) => unknown): boolean;
    /**
     * Returns true if the predicate returns false for every item in the Stream
     * @param predicate A predicate function that takes a Stream value and its index.
     */
    none(predicate: (val: T, index: number) => unknown): boolean;
    /**
     * Returns whether the Stream includes any of the the given values. Uses strict equality comparison. `===`
     */
    includes(...values: T[]): boolean;
    /**
     * Returns whether the Stream includes any of the the given values. Uses strict equality comparison. `===`
     *
     * Note: Alias of `includes()`
     */
    contains(...values: T[]): boolean;
    /**
     * Returns whether the Stream includes any of the the given values. Uses strict equality comparison. `===`
     *
     * Note: Alias of `includes()`
     */
    has(...values: T[]): boolean;
    /**
     * Returns whether the Stream includes all of the the given values. Uses strict equality comparison. `===`
     */
    includesAll(...values: T[]): boolean;
    /**
     * Returns whether the Stream includes all of the the given values. Uses strict equality comparison. `===`
     *
     * Note: Alias of `includesAll()`
     */
    containsAll(...values: T[]): boolean;
    /**
     * Returns whether the Stream includes all of the the given values. Uses strict equality comparison. `===`
     *
     * Note: Alias of `includesAll()`
     */
    hasAll(...values: T[]): boolean;
    /**
     * Returns whether this Stream has any items in common with items in the given iterables.
     */
    intersects<X>(...iterables: Iterable<X>[]): T extends X ? boolean : never;
    /**
     * Returns the number of items in this Stream.
     */
    count(): number;
    /**
     * Returns the number of items in this Stream.
     * @param predicate Only counts the items that match this predicate
     */
    count(predicate?: (value: T, index: number) => unknown): number;
    /**
     * Returns the number of items in this Stream.
     *
     * Note: Alias of `count`
     */
    length(): number;
    /**
     * Returns the number of items in this Stream.
     *
     * Note: Alias of `count`
     */
    size(): number;
    /**
     * Returns a new value by combining the items in this Stream using the given reducer function.
     * @param reducer A function which takes the current value and the next value and returns a new value.
     */
    fold<R>(initial: R, folder: (current: R, newValue: T, index: number) => R): R;
    /**
     * **This method does not work like array reduce. If that's what you're looking for, see `fold`**
     *
     * Returns a single `T` by combining the items in this Stream using the given reducer function. Returns `undefined`
     * if there are no items in this Stream.
     * @param reducer A function which takes the current value and the next value and returns a new value of the same type.
     */
    reduce(reducer: (current: T, newValue: T, index: number) => T): T | undefined;
    /**
     * Returns the first item in this Stream, or `undefined` if there are no items.
     */
    first(): T | undefined;
    /**
     * Returns the first item in this Stream that matches a predicate, or `orElse` if there are none.
     * @param predicate A predicate function that takes a Stream value and its index.
     */
    first<A>(predicate: undefined | ((val: T, index: number) => unknown), orElse: () => A): A extends never ? T : A extends never[] ? T extends any[] ? T | undefined[] : T | A : ({}) extends A ? T | Partial<T> : T | A;
    /**
     * Returns the first item in this Stream that matches a predicate, or `orElse` if there are none.
     * @param predicate A predicate function that takes a Stream value and its index.
     */
    first<A = never>(predicate?: (val: T, index: number) => unknown, orElse?: () => A): undefined | (never extends A ? T : A extends never[] ? T extends any[] ? T | undefined[] : T | A : ({}) extends A ? T | Partial<T> : T | A);
    /**
     * Returns the first item in this Stream, or `undefined` if there are no items.
     *
     * Note: Alias of `first()`
     */
    find(): T | undefined;
    /**
     * Returns the first item in this Stream that matches a predicate, or `orElse` if there are none.
     * @param predicate A predicate function that takes a Stream value and its index.
     *
     * Note: Alias of `first()`
     */
    find<A>(predicate: undefined | ((val: T, index: number) => unknown), orElse: () => A): A extends never ? T : A extends never[] ? T extends any[] ? T | undefined[] : T | A : ({}) extends A ? T | Partial<T> : T | A;
    /**
     * Returns the first item in this Stream that matches a predicate, or `orElse` if there are none.
     * @param predicate A predicate function that takes a Stream value and its index.
     *
     * Note: Alias of `first()`
     */
    find<A = never>(predicate?: (val: T, index: number) => unknown, orElse?: () => A): undefined | (never extends A ? T : A extends never[] ? T extends any[] ? T | undefined[] : T | A : ({}) extends A ? T | Partial<T> : T | A);
    /**
     * Returns the last item in this Stream, or `undefined` if there are no items.
     */
    last(): T | undefined;
    /**
     * Returns the last item in this Stream that matches a predicate, or `orElse` if there are none.
     * @param predicate A predicate function that takes a Stream value and its index.
     */
    last<A>(predicate: undefined | ((val: T, index: number) => unknown), orElse: () => A): A extends never ? T : A extends never[] ? T extends any[] ? T | undefined[] : T | A : ({}) extends A ? T | Partial<T> : T | A;
    /**
     * Returns the last item in this Stream that matches a predicate, or `orElse` if there are none.
     * @param predicate A predicate function that takes a Stream value and its index.
     */
    last<A = never>(predicate?: (val: T, index: number) => unknown, orElse?: () => A): undefined | (never extends A ? T : A extends never[] ? T extends any[] ? T | undefined[] : T | A : ({}) extends A ? T | Partial<T> : T | A);
    /**
     * Returns the item at the given index, or `undefined` if it does not exist.
     *
     * Note: An alias for `drop(index - 1).first()`.
     */
    at(index: number): T | undefined;
    /**
     * Returns the item at the given index, or `orElse` if it does not exist.
     *
     * Note: An alias for `drop(index - 1).first(orElse)`.
     */
    at<A>(index: number, orElse: () => A): A extends never ? T : A extends never[] ? T extends any[] ? T | undefined[] : T | A : ({}) extends A ? T | Partial<T> : T | A;
    /**
     * Returns the item at the given index, or, if it does not exist, `orElse`, or `undefined` if `orElse` is not provided.
     *
     * Note: An alias for `drop(index - 1).first(orElse)`.
     */
    at<A = never>(index: number, orElse?: () => A): undefined | (never extends A ? T : A extends never[] ? T extends any[] ? T | undefined[] : T | A : ({}) extends A ? T | Partial<T> : T | A);
    /**
     * Returns a random item in this Stream, or `undefined` if there are none.
     */
    random(): T | undefined;
    /**
     * Returns a random item in this Stream, or `orElse` if there are none.
     */
    random<A>(random: (() => number) | undefined, orElse: () => A): A extends never ? T : A extends never[] ? T extends any[] ? T | undefined[] : T | A : ({}) extends A ? T | Partial<T> : T | A;
    /**
     * Returns a random item in this Stream, or `orElse` if there are none.
     */
    random<A = never>(random?: () => number, orElse?: () => A): undefined | (never extends A ? T : A extends never[] ? T extends any[] ? T | undefined[] : T | A : ({}) extends A ? T | Partial<T> : T | A);
    /**
     * Returns a value of type R, generated with the given collector function.
     * @param collector A function that takes the iterable, and returns type R
     */
    collect<R>(collector: (stream: Stream<T>) => R): R;
    /**
     * Returns a value of type R, generated with the given collector function.
     * @param collector A function that takes the iterable, and returns type R
     */
    collect<R, A extends any[]>(collector: (stream: Stream<T>, ...args: A) => R, ...args: A): R;
    /**
     * Returns a value of type R, generated with the given collector function.
     * @param collector A function that takes the splatted values in this iterable, and returns type R
     */
    splat<R>(collector: (...args: T[]) => R, ...args: T[]): R;
    /**
     * Returns a promise that will return the value of the first completed promise in this stream.
     *
     * Note: Alias of `Promise.race(stream.toArray())`
     */
    race(): Promise<T extends Promise<infer R> ? R : never>;
    /**
     * Returns a promise of a stream with all items await-ed.
     *
     * Note: Alias of `Stream.from(Promise.all(stream.toArray()))`
     */
    rest(): Promise<T extends Promise<infer R> ? Stream<R> : never> & {
        isResolved?: true;
    };
    /**
     * Collects the items in this Stream to an array.
     */
    toArray(): T[];
    /**
     * Appends the items in this Stream to the end of the given array.
     */
    toArray<E>(array: T extends E ? E[] : never): E[];
    /**
     * Collects the items in this Stream to an array, using a mapping function.
     * @param mapper A mapping function which takes an item in this Stream and returns a replacement item.
     */
    toArray<M>(mapper: (value: T, index: number) => M): M[];
    /**
     * Appends the items in this Stream to the end of the given array, using a mapping function.
     * @param array The array to insert into.
     * @param mapper A mapping function which takes an item in this Stream and returns a replacement item.
     */
    toArray<E, M extends E>(array: E[], mapper: (value: T, index: number) => M): E[];
    /**
     * Collects the items in this Stream to a Set.
     */
    toSet(): Set<T>;
    /**
     * Appends the items in this Stream to the end of the given Set.
     */
    toSet<E>(set: T extends E ? Set<E> : never): Set<E>;
    /**
     * Collects the items in this Stream to a Set, using a mapping function.
     * @param mapper A mapping function which takes an item in this Stream and returns a replacement item.
     */
    toSet<M>(mapper: (value: T, index: number) => M): Set<M>;
    /**
     * Appends the items in this Stream to the end of the given Set, using a mapping function.
     * @param set The set to insert into.
     * @param mapper A mapping function which takes an item in this Stream and returns a replacement item.
     */
    toSet<E, M extends E>(set: Set<E>, mapper: (value: T, index: number) => M): Set<E>;
    /**
     * Constructs a Map instance from the key-value pairs in this Stream.
     */
    toMap(): T extends [infer K, infer V] ? Map<K, V> : T extends readonly [infer K2, infer V2] ? Map<K2, V2> : never;
    /**
     * Puts the key-value pairs in this Stream into the given Map.
     */
    toMap<KE, VE>(map: Unary<Key<T>> extends Unary<KE> ? Unary<Value<T>> extends Unary<VE> ? Map<KE, VE> : never : never): Map<KE, VE>;
    /**
     * Constructs a Map instance from the items in this Stream, using a mapping function.
     * @param mapper A mapping function which takes an item in this Stream and returns a key-value pair.
     */
    toMap<K, V>(mapper: (value: T, index: number) => [K, V] | readonly [K, V]): Map<K, V>;
    /**
     * Puts the key-value pairs in this Stream into the given Map, using a mapping function.
     * @param map The map to put key-value pairs into.
     * @param mapper A mapping function which takes an item in this Stream and returns a key-value pair.
     */
    toMap<KE, VE, KM extends KE, VM extends VE>(map: Map<KE, VE>, mapper: (value: T, index: number) => [KM, VM] | readonly [KM, VM]): Map<KE, VE>;
    /**
     * Constructs an object from the key-value pairs in this Stream.
     */
    toObject(): T extends [infer K, infer V] ? {
        [key in Extract<K, string | number | symbol>]: V;
    } : T extends readonly [infer K2, infer V2] ? {
        [key in Extract<K2, string | number | symbol>]: V2;
    } : never;
    /**
     * Constructs an object from the items in this Stream, using a mapping function.
     * @param mapper A mapping function which takes an item in this Stream and returns a key-value pair.
     */
    toObject<K extends string | number | symbol, V>(mapper: (value: T, index: number) => [K, V] | readonly [K, V]): {
        [key in K]: V;
    };
    /**
     * Puts the key-value pairs in this Stream into the given object.
     */
    toObject<E>(obj: Unary<Key<T>> extends Unary<keyof E> ? Unary<Value<T>> extends Unary<E[keyof E]> ? E : never : never): E;
    /**
     * Puts the key-value pairs in this Stream into the given object, using a mapping function.
     * @param map The map to put key-value pairs into.
     * @param mapper A mapping function which takes an item in this Stream and returns a key-value pair.
     */
    toObject<E, KM extends keyof E, VM extends E[keyof E]>(obj: E, mapper: (value: T, index: number) => [KM, VM] | readonly [KM, VM]): E;
    /**
     * Combines the items in this Stream into a string.
     * @param concatenator A substring to be placed between every item in this Stream. If not provided, uses `""`
     */
    toString(concatenator?: string): string;
    /**
     * Combines the items in this Stream into a string, via a reducer function.
     * @param concatenator Takes the current string and the next value and returns the new string.
     */
    toString(concatenator: (current: string | undefined, value: T) => string): string;
    /**
     * Combines the items in this Stream into a string, via a reducer function.
     * @param concatenator Takes the current string and the next value and returns the new string.
     * @param startingString Concatenates against this string.
     */
    toString(concatenator: (current: string, value: T) => string, startingString: string): string;
    /**
     * Combines the items in this Stream into a string, via a reducer function.
     * @param concatenator Takes the current string and the next value and returns the new string.
     * @param toStringFirstValue Calls `toString` on the first value in this Stream for concatenating against future values.
     */
    toString(concatenator: (current: string, value: T) => string, toStringFirstValue: true): string;
    /**
     * Combines the items in this Stream into a string, via a reducer function.
     * @param concatenator Takes the current string and the next value and returns the new string.
     * @param firstValueMapper A function which converts the first value in the stream into a string, in order to be concatenated with subsequent values.
     */
    toString(concatenator: (current: string, value: T) => string, firstValueMapper: (value: T) => string): string;
    /**
     * Returns the smallest number in this stream, or `undefined` if this stream is empty.
     */
    min(): T extends number ? T | undefined : never;
    /**
     * Returns the item of the smallest value in this stream, or `undefined` if this stream is empty.
     * @param mapper Converts an item in this stream to the value for comparison.
     */
    min(mapper: (value: T, index: number) => number): T | undefined;
    /**
     * Returns the largest number in this stream, or `undefined` if this stream is empty.
     */
    max(): T extends number ? T | undefined : never;
    /**
     * Returns the item of the largest value in this stream, or `undefined` if this stream is empty.
     * @param mapper Converts an item in this stream to the value for comparison.
     */
    max(mapper: (value: T, index: number) => number): T | undefined;
    /**
     * Iterates through the entire stream.
     */
    iterateToEnd(): void;
    /**
     * Iterates through the entire stream.
     *
     * Note: Alias of `iterateToEnd()`
     */
    finish(): void;
    /**
     * Iterates through the entire stream.
     *
     * Note: Alias of `iterateToEnd()`
     */
    end(): void;
    /**
     * Iterates through the entire stream.
     *
     * Note: Alias of `iterateToEnd()`
     */
    complete(): void;
    /**
     * Iterates through the entire stream.
     *
     * Note: Alias of `iterateToEnd()`
     */
    flush(): void;
    /**
     * Runs a function on each item in this Stream.
     * @param user The function to call for each item
     * @returns The number of items that were looped through.
     */
    forEach(user: (val: T, index: number) => any): number;
    /**
     * Runs a function on each item in this Stream.
     * @param user The function to call for each item
     * @returns The number of items that were looped through.
     */
    splatEach(user: T extends any[] ? ((...args: T) => any) : T extends Iterable<infer V> ? ((...args: V[]) => any) : never): number;
    next(): IteratorResult<T>;
    /**
     * Returns whether the Stream has a next entry.
     */
    hasNext(): boolean;
}
type Action<T> = [
    "filter",
    (val: T, index: number) => unknown,
    number
] | [
    "map",
    (val: T, index: number) => any,
    number
] | [
    "take",
    number
] | [
    "takeWhile",
    (val: T) => unknown
] | [
    "takeUntil",
    (val: T) => unknown
] | [
    "drop",
    number
] | [
    "dropWhile",
    (val: T) => unknown
] | [
    "dropUntil",
    (val: T) => unknown
] | [
    "step",
    number,
    number
] | [
    "insert",
    number,
    any[]
] | [
    undefined,
    any?,
    any?
];
declare class StreamImplementation<T> implements Stream<T> {
    private readonly actions?;
    value: T;
    done: boolean;
    private iterators;
    private iteratorIndex;
    private doneNext?;
    private get savedNext();
    private actionsNeedDeleted?;
    private parent;
    constructor(iterator?: Iterator<T> | Iterator<T>[], actions?: Action<T>[] | undefined);
    [Symbol.iterator](): this;
    [Symbol.asyncIterator](): any;
    filter(filter?: (val: T, index: number) => any): any;
    filter2(filter?: (val: T, index: number) => any): any;
    filterNullish(): any;
    filterFalsey(removeZeroAndEmptyString?: boolean): any;
    map(mapper?: (val: T, index: number) => any): Stream<any>;
    flatMap(mapper?: (value: T, i: number) => Iterable<any>): any;
    take(amount: number): this | Stream<T> | StreamImplementation<any>;
    takeWhile(predicate: (val: T) => unknown): StreamImplementation<any>;
    takeUntil(predicate: (val: T) => unknown): StreamImplementation<any>;
    drop(amount: number): Stream<any> | this | StreamImplementation<any>;
    dropWhile(predicate: (val: T) => unknown): this | StreamImplementation<any>;
    dropUntil(predicate: (val: T) => unknown): this | StreamImplementation<any>;
    step(step: number): this | Stream<T> | StreamImplementation<any>;
    sort(comparator?: ((a: T, b: T) => number) | false): StreamImplementation<T>;
    sortBy(mapper: (value: T) => any, comparator?: ((a: any, b: any) => number) | false): Stream<any> | this;
    reverse(): StreamImplementation<T>;
    distinct(): StreamImplementation<T>;
    shuffle(random?: () => number): StreamImplementation<T>;
    partition(sorter: (val: T) => any, mapper?: (val: T) => any): Partitions<any, any>;
    unzip(): any;
    add(...items: any[]): StreamImplementation<any>;
    insert(...items: any[]): StreamImplementation<any>;
    insertAt(index: number, ...items: any[]): StreamImplementation<any>;
    merge(...iterables: Iterable<any>[]): StreamImplementation<any>;
    collectStream(): StreamImplementation<T>;
    entries(): Stream<any>;
    any(predicate: (val: T, index: number) => unknown): boolean;
    some(predicate: (val: T, index: number) => unknown): boolean;
    every(predicate: (val: T, index: number) => unknown): boolean;
    all(predicate: (val: T, index: number) => unknown): boolean;
    none(predicate: (val: T, index: number) => unknown): boolean;
    includes(...values: T[]): boolean;
    contains(...values: T[]): boolean;
    has(...values: T[]): boolean;
    includesAll(...values: T[]): boolean;
    containsAll(...values: T[]): boolean;
    hasAll(...values: T[]): boolean;
    intersects<X>(...iterables: Iterable<X>[]): T extends X ? boolean : never;
    count(predicate?: (value: T, index: number) => any): number;
    length(): number;
    size(): number;
    fold<R>(initial: R, folder: (current: R, newValue: T, index: number) => R): R;
    reduce(reducer: (current: T, newValue: T, index: number) => T): T;
    first(): T | undefined;
    first(predicate?: (val: T, index: number) => unknown, orElse?: () => T): T | undefined;
    first(predicate: undefined | ((val: T, index: number) => unknown), orElse: () => T): T;
    find(): T | undefined;
    find(predicate?: (val: T, index: number) => unknown, orElse?: () => T): T | undefined;
    find(predicate: undefined | ((val: T, index: number) => unknown), orElse: () => T): T;
    last(): T | undefined;
    last(predicate?: (val: T, index: number) => unknown, orElse?: () => T): T | undefined;
    last(predicate: undefined | ((val: T, index: number) => unknown), orElse: () => T): T;
    at(index: number): T | undefined;
    at(index: number, orElse: () => T): T;
    at(index: number, orElse?: () => T): T | undefined;
    random(random?: () => number, orElse?: () => any): any;
    collect<R, A extends any[]>(collector: (stream: Stream<T>, ...args: A) => R, ...args: A): R;
    splat<R>(collector: (...values: T[]) => R, ...args: T[]): R;
    race(): Promise<any>;
    rest(): any;
    toArray(): T[];
    toArray<N>(array: N[]): (T | N)[];
    toArray<M>(mapper: (value: T, index: number) => M): M[];
    toArray<N, M>(array: N[], mapper: (value: T, index: number) => M): (T | N | M)[];
    toSet(): Set<T>;
    toSet<N>(set: Set<N>): Set<T | N>;
    toSet<M>(mapper: (value: T, index: number) => M): Set<M>;
    toSet<N, M>(set: Set<N>, mapper: (value: T, index: number) => M): Set<T | N | M>;
    toMap(result?: Map<any, any> | ((value: any, index: number) => [any, any] | readonly [any, any]), mapper?: (value: any, index: number) => [any, any] | readonly [any, any]): any;
    toObject(result?: any | ((value: any, index: number) => [any, any]), mapper?: (value: any, index: number) => [any, any] | readonly [any, any]): any;
    toString(concatenator?: string): string;
    toString(concatenator: (current: string | undefined, value: T) => string): string;
    toString(concatenator: (current: string, value: T) => string, startingValue: string | true | ((value: T) => string)): string;
    min(): T extends number ? T | undefined : never;
    min(mapper: (value: T, index: number) => number): T | undefined;
    max(): T extends number ? T | undefined : never;
    max(mapper: (value: T, index: number) => number): T | undefined;
    iterateToEnd(): void;
    finish(): void;
    end(): void;
    complete(): void;
    flush(): void;
    forEach(user: (val: T, index: number) => any): number;
    splatEach(user?: (...args: any[]) => any): number;
    next(): this;
    hasNext(): boolean;
    private restreamCurrent;
    private getWithAction;
}
declare namespace StreamImplementation {
    function is<T = any>(value: unknown): value is Stream<T>;
    function empty<T = any>(): Stream<T>;
    function from<T>(iterable?: Iterable<T> | (() => Iterable<T> | undefined)): Stream<T>;
    function iterators<ITERATORS extends Iterator<any>[]>(...iterators: ITERATORS): Stream<ITERATORS[number] extends Iterator<infer T> ? T : never>;
    function of<A extends any[]>(...args: A): Stream<A[number]>;
    function range(end: number): Stream<number>;
    function range(start: number, end?: number, step?: number): Stream<number>;
    /**
     * Returns a Stream that iterates over the entries of a map, in key-value tuples.
     */
    function entries<K, V>(map?: Map<K, V>): Stream<[K, V]>;
    /**
     * Returns a Stream that iterates over the entries of an array.
     * @param step If not provided, walks through the array one item at a time. If a positive number, walks forwards, every
     * `step` entries. If a negative number, walks backwards through the array.
     */
    function entries<T>(arr: T[], step?: number): Stream<[number, T]>;
    /**
     * Returns a Stream that iterates over the entries of an object, in key-value tuples.
     */
    function entries<T extends object>(obj?: T): Stream<[Extract<keyof T, string>, T[Extract<keyof T, string>]]>;
    /**
     * Returns a Stream that iterates over the entries of an object, in key-value tuples.
     */
    function entries<K, V>(obj?: any): Stream<[K, V]>;
    /**
     * Returns a Stream that iterates over the keys of a map.
     */
    function keys<K>(map: Map<K, any>): Stream<K>;
    /**
     * Returns a Stream that iterates over the keys of an object.
     */
    function keys<T extends object>(obj: T): Stream<keyof T>;
    /**
     * Returns a Stream that iterates over the keys of an object.
     */
    function keys<K extends string | number>(obj: {
        [key in K]: any;
    }): Stream<K>;
    /**
     * Returns a Stream that iterates over the values of a map.
     */
    function values<V>(map: Map<any, V>): Stream<V>;
    /**
     * Returns a Stream that iterates over the values of an array.
     * @param step If not provided, walks through the array one item at a time. If a positive number, walks forwards, every
     * `step` entries. If a negative number, walks backwards through the array.
     */
    function values<T>(arr: T[], step?: number): Stream<T>;
    /**
     * Returns a Stream that iterates over the values of an object.
     */
    function values<T extends object>(obj: T): Stream<T[keyof T]>;
    /**
     * Takes two iterables representing "keys" and "values", and turns them into a Stream of 2-value tuples. The resulting
     * Stream will end when either of the iterables runs out of items. (Its size will be that of the smaller of the two
     * input iterables/streams).
     */
    function zip<K, V>(keysIterable: Iterable<K> | Stream<K>, valuesIterable: Iterable<V> | Stream<V>): Stream<[K, V]>;
}
type StreamImplementationClass = typeof StreamImplementation;
interface StreamExportClass extends StreamImplementationClass {
    prototype: Stream<any>;
}
declare const Stream: StreamExportClass;
export default Stream;
