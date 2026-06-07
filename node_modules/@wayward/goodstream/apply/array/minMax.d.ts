declare global {
    interface Array<T> {
        /**
         * Returns the smallest number in this array, or `undefined` if this array is empty.
         */
        min(): T extends number ? T | undefined : never;
        /**
         * Returns the item of the smallest value in this array, or `undefined` if this array is empty.
         * @param mapper Converts an item in this array to the value for comparison.
         */
        min(mapper: (value: T, index: number) => number): T | undefined;
        /**
         * Returns the largest number in this array, or `undefined` if this array is empty.
         */
        max(): T extends number ? T | undefined : never;
        /**
         * Returns the item of the largest value in this array, or `undefined` if this array is empty.
         * @param mapper Converts an item in this array to the value for comparison.
         */
        max(mapper: (value: T, index: number) => number): T | undefined;
    }
    interface ReadonlyArray<T> {
        /**
         * Returns the smallest number in this array, or `undefined` if this array is empty.
         */
        min(): T extends number ? T | undefined : never;
        /**
         * Returns the item of the smallest value in this array, or `undefined` if this array is empty.
         * @param mapper Converts an item in this array to the value for comparison.
         */
        min(mapper: (value: T, index: number) => number): T | undefined;
        /**
         * Returns the largest number in this array, or `undefined` if this array is empty.
         */
        max(): T extends number ? T | undefined : never;
        /**
         * Returns the item of the largest value in this array, or `undefined` if this array is empty.
         * @param mapper Converts an item in this array to the value for comparison.
         */
        max(mapper: (value: T, index: number) => number): T | undefined;
    }
}
export {};
