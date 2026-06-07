declare global {
    interface Array<T> {
        /**
         * Collects the items in this array to a Set.
         */
        toSet(): Set<T>;
        /**
         * Appends the items in this array to the end of the given Set.
         */
        toSet<E>(set: T extends E ? Set<E> : never): Set<E>;
        /**
         * Collects the items in this array to a Set, using a mapping function.
         * @param mapper A mapping function which takes an item in this array and returns a replacement item.
         */
        toSet<M>(mapper: (value: T, index: number) => M): Set<M>;
        /**
         * Appends the items in this array to the end of the given Set, using a mapping function.
         * @param set The set to insert into.
         * @param mapper A mapping function which takes an item in this array and returns a replacement item.
         */
        toSet<E, M extends E>(set: Set<E>, mapper: (value: T, index: number) => M): Set<E>;
    }
    interface ReadonlyArray<T> {
        /**
         * Collects the items in this array to a Set.
         */
        toSet(): Set<T>;
        /**
         * Appends the items in this array to the end of the given Set.
         */
        toSet<E>(set: T extends E ? Set<E> : never): Set<E>;
        /**
         * Collects the items in this array to a Set, using a mapping function.
         * @param mapper A mapping function which takes an item in this array and returns a replacement item.
         */
        toSet<M>(mapper: (value: T, index: number) => M): Set<M>;
        /**
         * Appends the items in this array to the end of the given Set, using a mapping function.
         * @param set The set to insert into.
         * @param mapper A mapping function which takes an item in this array and returns a replacement item.
         */
        toSet<E, M extends E>(set: Set<E>, mapper: (value: T, index: number) => M): Set<E>;
    }
}
export {};
