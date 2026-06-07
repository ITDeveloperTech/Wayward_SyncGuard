import Partitions from "./Partitions";
import Stream from "./Stream";
declare class UnzippedPartitionsImplementation<K, V> extends Partitions<any, any> implements UnzippedPartitions<K, V> {
    constructor(stream: Stream<[K, V]>, streamMapper: <V2>(val: Iterator<V2>) => Stream<V2>);
    keys(): Stream<K>;
    values(): Stream<V>;
}
interface UnzippedPartitions<K, V> extends Iterator<["key", Stream<K>] | ["value", Stream<V>]> {
    get(partition: "key"): Stream<K>;
    get(partition: "value"): Stream<V>;
    keys(): Stream<K>;
    values(): Stream<V>;
    partitions(): Stream<["key", Stream<K>] | ["value", Stream<V>]>;
}
declare const UnzippedPartitions: typeof UnzippedPartitionsImplementation;
export default UnzippedPartitions;
