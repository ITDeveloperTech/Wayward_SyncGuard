declare global {
    interface Array<T> {
        /**
         * Remove `undefined` values from an array
         */
        filterNullish(): Exclude<T, undefined | null>[];
        /**
         * Remove all falsey values from an array (does not filter out `0` and `""`)
         */
        filterFalsey(): Exclude<T, undefined | null | false>[];
        /**
         * Remove all falsey values from an array, including `0` and `""`
         */
        filterFalsey(removeZeroAndEmptyString: true): Exclude<T, undefined | null | false | 0 | "">[];
    }
    interface ReadonlyArray<T> {
        /**
         * Remove `undefined` and `null` values from an array
         */
        filterNullish(): Exclude<T, undefined | null>[];
        /**
         * Remove all falsey values from an array (does not filter out `0` and `""`)
         */
        filterFalsey(): Exclude<T, undefined | null | false>[];
        /**
         * Remove all falsey values from an array, including `0` and `""`
         */
        filterFalsey(removeZeroAndEmptyString: true): Exclude<T, undefined | null | false | 0 | "">[];
    }
}
export {};
