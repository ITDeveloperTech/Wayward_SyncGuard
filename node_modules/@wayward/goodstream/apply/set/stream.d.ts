import Stream from "../../Stream";
declare global {
    interface Set<T> {
        stream(): Stream<T>;
    }
}
