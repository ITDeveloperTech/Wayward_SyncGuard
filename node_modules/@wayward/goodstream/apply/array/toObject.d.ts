type Key<T> = T extends [infer K, any] ? K : T extends readonly [infer K2, any] ? K2 : never;
type Value<T> = T extends [any, infer V] ? V : T extends readonly [any, infer V2] ? V2 : never;
type Unary<T, R = void> = (arg: T) => R;
declare global {
    interface Array<T> {
        /**
         * Constructs an object from the key-value pairs in this array.
         */
        toObject(): T extends [infer K, infer V] ? {
            [key in Extract<K, string | number | symbol>]: V;
        } : T extends readonly [infer K2, infer V2] ? {
            [key in Extract<K2, string | number | symbol>]: V2;
        } : never;
        /**
         * Constructs an object from the items in this array, using a mapping function.
         * @param mapper A mapping function which takes an item in this array and returns a key-value pair.
         */
        toObject<K extends string | number | symbol, V>(mapper: (value: T, index: number) => [K, V] | readonly [K, V]): {
            [key in K]: V;
        };
        /**
         * Puts the key-value pairs in this array into the given object.
         */
        toObject<E>(obj: Unary<Key<T>> extends Unary<keyof E> ? Unary<Value<T>> extends Unary<E[keyof E]> ? E : never : never): E;
        /**
         * Puts the key-value pairs in this array into the given object, using a mapping function.
         * @param map The map to put key-value pairs into.
         * @param mapper A mapping function which takes an item in this array and returns a key-value pair.
         */
        toObject<E, KM extends keyof E, VM extends E[keyof E]>(obj: E, mapper: (value: T, index: number) => [KM, VM] | readonly [KM, VM]): E;
    }
    interface ReadonlyArray<T> {
        /**
         * Constructs an object from the key-value pairs in this array.
         */
        toObject(): T extends [infer K, infer V] ? {
            [key in Extract<K, string | number | symbol>]: V;
        } : T extends readonly [infer K2, infer V2] ? {
            [key in Extract<K2, string | number | symbol>]: V2;
        } : never;
        /**
         * Constructs an object from the items in this array, using a mapping function.
         * @param mapper A mapping function which takes an item in this array and returns a key-value pair.
         */
        toObject<K extends string | number | symbol, V>(mapper: (value: T, index: number) => [K, V] | readonly [K, V]): {
            [key in K]: V;
        };
        /**
         * Puts the key-value pairs in this array into the given object.
         */
        toObject<E>(obj: Unary<Key<T>> extends Unary<keyof E> ? Unary<Value<T>> extends Unary<E[keyof E]> ? E : never : never): E;
        /**
         * Puts the key-value pairs in this array into the given object, using a mapping function.
         * @param map The map to put key-value pairs into.
         * @param mapper A mapping function which takes an item in this array and returns a key-value pair.
         */
        toObject<E, KM extends keyof E, VM extends E[keyof E]>(obj: E, mapper: (value: T, index: number) => [KM, VM] | readonly [KM, VM]): E;
    }
}
export {};
