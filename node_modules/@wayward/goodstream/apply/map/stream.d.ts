import Stream from "../../Stream";
declare global {
    interface Map<K, V> {
        /**
         * Returns a Stream for the values of this Map.
         * Note: Alias of `Stream.from(map.values())`
         */
        valueStream(): Stream<V>;
        /**
         * Returns a Stream for the keys of this Map.
         * Note: Alias of `Stream.from(map.keys())`
         */
        keyStream<K2 = K>(): K extends K2 ? Stream<K2> : never;
        /**
         * Returns a Stream for key-value tuple entries of this Map.
         * Note: Alias of `Stream.from(map)`
         */
        entryStream<K2 = K, V2 = V>(): K extends K2 ? V extends V2 ? Stream<[K2, V2]> : never : never;
    }
}
