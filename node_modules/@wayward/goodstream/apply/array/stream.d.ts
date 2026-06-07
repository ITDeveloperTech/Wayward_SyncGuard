import Stream from "../../Stream";
declare global {
    interface Array<T> {
        /**
         * Returns a Stream that iterates over the values of an array.
         * @param step If not provided, walks through the array one item at a time. If a positive number, walks forwards, every
         * `step` entries. If a negative number, walks backwards through the array.
         */
        stream(step?: number): Stream<T>;
        /**
         * Returns a Stream that iterates over the entries of an array.
         * @param step If not provided, walks through the array one item at a time. If a positive number, walks forwards, every
         * `step` entries. If a negative number, walks backwards through the array.
         */
        entryStream(step?: number): Stream<[number, T]>;
    }
    interface ReadonlyArray<T> {
        /**
         * Returns a Stream that iterates over the values of an array.
         * @param step If not provided, walks through the array one item at a time. If a positive number, walks forwards, every
         * `step` entries. If a negative number, walks backwards through the array.
         */
        stream(step?: number): Stream<T>;
        /**
         * Returns a Stream that iterates over the entries of an array.
         * @param step If not provided, walks through the array one item at a time. If a positive number, walks forwards, every
         * `step` entries. If a negative number, walks backwards through the array.
         */
        entryStream(step?: number): Stream<[number, T]>;
    }
}
