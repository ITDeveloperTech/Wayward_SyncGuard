type Key<T> = T extends [infer K, any] ? K : T extends readonly [infer K2, any] ? K2 : never;
type Value<T> = T extends [any, infer V] ? V : T extends readonly [any, infer V2] ? V2 : never;
type Unary<T, R = void> = (arg: T) => R;
declare global {
    interface Array<T> {
        /**
         * Constructs a Map instance from the key-value pairs in this array.
         */
        toMap(): T extends [infer K, infer V] ? Map<K, V> : T extends readonly [infer K2, infer V2] ? Map<K2, V2> : never;
        /**
         * Puts the key-value pairs in this array into the given Map.
         */
        toMap<KE, VE>(map: Unary<Key<T>> extends Unary<KE> ? Unary<Value<T>> extends Unary<VE> ? Map<KE, VE> : never : never): Map<KE, VE>;
        /**
         * Constructs a Map instance from the items in this array, using a mapping function.
         * @param mapper A mapping function which takes an item in this array and returns a key-value pair.
         */
        toMap<K, V>(mapper: (value: T, index: number) => [K, V] | readonly [K, V]): Map<K, V>;
        /**
         * Puts the key-value pairs in this array into the given Map, using a mapping function.
         * @param map The map to put key-value pairs into.
         * @param mapper A mapping function which takes an item in this array and returns a key-value pair.
         */
        toMap<KE, VE, KM extends KE, VM extends VE>(map: Map<KE, VE>, mapper: (value: T, index: number) => [KM, VM] | readonly [KM, VM]): Map<KE, VE>;
    }
    interface ReadonlyArray<T> {
        /**
         * Constructs a Map instance from the key-value pairs in this array.
         */
        toMap(): T extends [infer K, infer V] ? Map<K, V> : T extends readonly [infer K2, infer V2] ? Map<K2, V2> : never;
        /**
         * Puts the key-value pairs in this array into the given Map.
         */
        toMap<KE, VE>(map: Unary<Key<T>> extends Unary<KE> ? Unary<Value<T>> extends Unary<VE> ? Map<KE, VE> : never : never): Map<KE, VE>;
        /**
         * Constructs a Map instance from the items in this array, using a mapping function.
         * @param mapper A mapping function which takes an item in this array and returns a key-value pair.
         */
        toMap<K, V>(mapper: (value: T, index: number) => [K, V] | readonly [K, V]): Map<K, V>;
        /**
         * Puts the key-value pairs in this array into the given Map, using a mapping function.
         * @param map The map to put key-value pairs into.
         * @param mapper A mapping function which takes an item in this array and returns a key-value pair.
         */
        toMap<KE, VE, KM extends KE, VM extends VE>(map: Map<KE, VE>, mapper: (value: T, index: number) => [KM, VM] | readonly [KM, VM]): Map<KE, VE>;
    }
}
export {};
