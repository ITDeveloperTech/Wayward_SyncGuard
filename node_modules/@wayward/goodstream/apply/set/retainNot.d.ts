declare global {
    interface Set<T> {
        /**
         * Deletes the given value from the set and returns whether any values remain.
         * @param value The value to delete.
         * @returns whether any values remain.
         */
        retainNot(value: T): boolean;
    }
}
export {};
