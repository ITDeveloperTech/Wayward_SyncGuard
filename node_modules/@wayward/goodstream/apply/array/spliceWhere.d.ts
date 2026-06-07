declare global {
    interface Array<T> {
        /**
         * Removes the values from this array that match the given predicate function.
         * @param predicate A predicate that takes a value and its index in the array, and returns a value which will be checked for truthiness.
         *
         * Note: Unlike `splice`, this method does *not* return the deleted values! This is due to performance reasons.
         */
        spliceWhere(predicate: (val: T, index: number) => any): this;
    }
}
export {};
