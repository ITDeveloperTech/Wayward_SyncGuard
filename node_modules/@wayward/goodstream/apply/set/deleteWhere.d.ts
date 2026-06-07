declare global {
    interface Set<T> {
        /**
         * Removes the values from this set that match the given predicate function.
         * @param predicate A predicate that takes a value, and returns a value which will be checked for truthiness.
         * @returns whether any values were deleted.
         */
        deleteWhere(predicate: (val: T) => any): boolean;
    }
}
export {};
