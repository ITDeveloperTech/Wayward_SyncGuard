import Stream from "./Stream";
export default class Partitions<T, K, V = T> implements Iterator<[K, Stream<V>]> {
    private readonly stream;
    private readonly sorter;
    private readonly mapper;
    private readonly streamMapper;
    value: [K, Stream<V>];
    done: boolean;
    private readonly _partitions;
    private readonly partitionKeys;
    private partitionKeyIndex;
    private index;
    constructor(stream: Iterator<V>, sorter: (val: V, index: number) => K, mapper: ((val: T, index: number) => V) | undefined, streamMapper: <V2>(val: Iterator<V2>) => Stream<V2>);
    /**
     * Returns a single partitioned Stream by the given key.
     * @param key The key of the partitioned Stream.
     *
     * Note: The partition Streams returned from this method are the same as returned by `partitions()`. Iterating through
     * a stream in either location will also empty it in the other.
     */
    get(key: K): Stream<V>;
    /**
     * Returns a Stream of tuples for all the partitioned Streams.
     *
     * Note: The partition Streams returned from this method are the same as returned by `partitions()`. Iterating through
     * a stream in either location will also empty it in the other.
     */
    partitions(): Stream<[K, Stream<V>]>;
    /**
     * Constructs a Map instance from the partitions.
     */
    toMap(): Map<K, Stream<V>>;
    /**
     * Puts the partitions into the given Map.
     */
    toMap<KE, VE>(map: Map<KE, VE>): Map<K | KE, Stream<V> | VE>;
    /**
     * Constructs a Map instance from the partitions using a mapping function.
     * @param mapper A mapping function which takes a Stream of partitioned values and returns a replacement value.
     */
    toMap<VN>(mapper: (value: Stream<V>, key: K) => VN): Map<K, VN>;
    /**
     * Puts the partitions into the given Map using a mapping function.
     * @param map The map to put key-partition pairs into.
     * @param mapper A mapping function which takes a Stream of partitioned values and returns a replacement value.
     */
    toMap<VN, KE, VE>(map: Map<KE, VE>, mapper: (value: Stream<V>, key: K) => VN): Map<K | KE, VN | VE>;
    /**
     * Constructs a Map instance from the partitions, each stream of values first being converted to an array.
     */
    toArrayMap(): Map<K, V[]>;
    /**
     * Inserts the partitions into the given Map, each stream of values first being converted to an array.
     */
    toArrayMap<KE, VE>(map: Map<KE, VE>): Map<K | KE, V[] | VE>;
    next(): this;
    private getPartition;
    private getFunctionForRetrievingNextInPartition;
}
