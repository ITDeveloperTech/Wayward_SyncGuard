import Stream from "../../Stream";
declare global {
    interface RegExp {
        /**
         * Returns a Stream for the matches of this string.
         */
        matches(string: string): Stream<RegExpExecArray>;
    }
}
