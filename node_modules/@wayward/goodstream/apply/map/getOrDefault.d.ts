declare global {
    interface Map<K, V> {
        /**
         * If the given key is present in this map, returns the value associated with it. If the given key is not present,
         * the `defaultGenerator` parameter is called and returned.
         * @param key The key.
         * @param defaultGenerator A function which will return the value for this key if it is not present.
         */
        getOrDefault<K2 extends K, V2>(key: K2, defaultGenerator: (key: K2) => V2): V2 extends never[] ? V extends any[] ? V : (V extends V2 ? V : V | V2) : (V extends V2 ? V : V | V2);
        /**
         * If the given key is present in this map, returns the value associated with it. If the given key is not present,
         * the `defaultGenerator` parameter is called and returned.
         * @param key The key.
         * @param defaultGenerator A function which will return the value for this key if it is not present.
         * @param assign Whether the generated default will be stored in the map.
         */
        getOrDefault<K2 extends K>(key: K2, defaultGenerator: (key: K2) => V, assign: true): V;
    }
}
export {};
