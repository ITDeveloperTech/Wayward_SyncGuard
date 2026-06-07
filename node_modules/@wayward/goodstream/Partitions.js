(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Partitions {
        stream;
        sorter;
        mapper;
        streamMapper;
        value;
        done = false;
        _partitions = new Map();
        partitionKeys = [];
        partitionKeyIndex = 0;
        index = 0;
        constructor(stream, sorter, mapper = val => val, streamMapper) {
            this.stream = stream;
            this.sorter = sorter;
            this.mapper = mapper;
            this.streamMapper = streamMapper;
        }
        /**
         * Returns a single partitioned Stream by the given key.
         * @param key The key of the partitioned Stream.
         *
         * Note: The partition Streams returned from this method are the same as returned by `partitions()`. Iterating through
         * a stream in either location will also empty it in the other.
         */
        get(key) {
            return this.getPartition(key)[1];
        }
        /**
         * Returns a Stream of tuples for all the partitioned Streams.
         *
         * Note: The partition Streams returned from this method are the same as returned by `partitions()`. Iterating through
         * a stream in either location will also empty it in the other.
         */
        partitions() {
            return this.streamMapper(this);
        }
        toMap(result, mapper) {
            if (typeof result === "function") {
                mapper = result;
                result = new Map();
            }
            else if (result === undefined) {
                result = new Map();
            }
            while (true) {
                this.next();
                if (this.done) {
                    return result;
                }
                const [key, value] = this.value;
                result.set(key, mapper ? mapper(value, key) : value);
            }
        }
        toArrayMap(map) {
            return this.toMap(map, partitionValueStream => partitionValueStream.toArray());
        }
        next() {
            let key;
            let partitionStream;
            if (this.partitionKeyIndex < this.partitionKeys.length) {
                key = this.partitionKeys[this.partitionKeyIndex++];
                [, partitionStream] = this.getPartition(key);
                this.value = [key, partitionStream];
                return this;
            }
            while (true) {
                const result = this.stream.next();
                if (result.done) {
                    this.done = true;
                    return this;
                }
                let willContinue = false;
                const sortedKey = this.sorter(result.value, this.index++);
                if (this._partitions.has(sortedKey)) {
                    willContinue = true;
                }
                let partition;
                [partition, partitionStream] = this.getPartition(sortedKey);
                partition.add(this.mapper(result.value, this.index));
                if (willContinue) {
                    continue;
                }
                this.value = [sortedKey, partitionStream];
                this.partitionKeyIndex++;
                return this;
            }
        }
        getPartition(key) {
            let partition = this._partitions.get(key);
            if (partition === undefined) {
                this.partitionKeys.push(key);
                const partitionStream = new Partition(this.getFunctionForRetrievingNextInPartition(key));
                this._partitions.set(key, partition = [partitionStream, this.streamMapper(partitionStream)]);
            }
            return partition;
        }
        getFunctionForRetrievingNextInPartition(key) {
            return () => {
                while (true) {
                    const result = this.stream.next();
                    if (result.done) {
                        return { done: true, value: undefined };
                    }
                    let value = result.value;
                    const sortedKey = this.sorter(value, this.index++);
                    value = this.mapper(value, this.index);
                    if (sortedKey === key) {
                        return { done: false, value };
                    }
                    const [partition] = this.getPartition(sortedKey);
                    partition.add(value);
                }
            };
        }
    }
    exports.default = Partitions;
    class Partition {
        getNext;
        value;
        done = false;
        items = [];
        index = 0;
        constructor(getNext) {
            this.getNext = getNext;
        }
        next() {
            if (this.index < this.items.length) {
                this.value = this.items[this.index++];
                return this;
            }
            const value = this.getNext();
            if (value.done) {
                this.done = true;
                return this;
            }
            this.value = value.value;
            return this;
        }
        add(...items) {
            this.items.push(...items);
        }
    }
});
