var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./ArrayStream", "./FlatMapStream", "./Partitions", "./RangeStream", "./UnzippedPartitions", "./util/Arrays", "./util/Iterables"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ArrayStream_1 = require("./ArrayStream");
    const FlatMapStream_1 = __importDefault(require("./FlatMapStream"));
    const Partitions_1 = __importDefault(require("./Partitions"));
    const RangeStream_1 = __importDefault(require("./RangeStream"));
    const UnzippedPartitions_1 = __importDefault(require("./UnzippedPartitions"));
    const Arrays_1 = require("./util/Arrays");
    const Iterables_1 = require("./util/Iterables");
    const LAST = Symbol();
    class StreamImplementation {
        actions;
        value;
        done;
        iterators;
        iteratorIndex = 0;
        doneNext;
        get savedNext() {
            Object.defineProperty(this, "savedNext", {
                value: [],
                configurable: false,
            });
            return this.savedNext;
        }
        actionsNeedDeleted;
        parent;
        constructor(iterator, actions) {
            this.actions = actions;
            if (!iterator) {
                this.done = true;
                return;
            }
            this.iterators = iterator === undefined ? [] : iterator;
        }
        [Symbol.iterator]() {
            return this;
        }
        [Symbol.asyncIterator]() {
            return {
                next: async () => {
                    this.next();
                    return {
                        done: this.done,
                        value: await this.value,
                    };
                },
            };
        }
        ////////////////////////////////////
        // Manipulation
        //
        filter(filter) {
            if (!filter)
                return this;
            const action = (0, Arrays_1.tuple)("filter", filter, 0);
            if (this.savedNext.length) {
                if (!filter(this.savedNext[0], action[2]++)) {
                    this.savedNext.pop();
                }
            }
            return this.getWithAction(action);
        }
        filter2(filter) {
            return this.filter(filter);
        }
        filterNullish() {
            return this.filter(value => value !== undefined && value !== null);
        }
        filterFalsey(removeZeroAndEmptyString = false) {
            return this.filter((value) => removeZeroAndEmptyString ? value : value !== undefined && value !== null && value !== false);
        }
        map(mapper) {
            if (!mapper)
                return this;
            const action = (0, Arrays_1.tuple)("map", mapper, 0);
            const mappedStream = this.getWithAction(action);
            if (mappedStream.savedNext.length)
                mappedStream.savedNext[0] = mapper(this.savedNext[0], action[2]++);
            return mappedStream;
        }
        flatMap(mapper) {
            return new StreamImplementation(new FlatMapStream_1.default(this, mapper));
        }
        take(amount) {
            if (amount === Infinity)
                return this;
            if (amount < 0 || !Number.isInteger(amount))
                throw new Error("Number of items to take must be a positive integer.");
            if (amount === 0) {
                return StreamImplementation.empty();
            }
            if (this.savedNext.length) {
                amount--;
            }
            return this.getWithAction(["take", amount]);
        }
        takeWhile(predicate) {
            if (this.savedNext.length) {
                if (!predicate(this.savedNext[0])) {
                    this.done = true;
                }
            }
            return this.getWithAction(["takeWhile", predicate]);
        }
        takeUntil(predicate) {
            if (this.savedNext.length) {
                if (predicate(this.savedNext[0])) {
                    this.done = true;
                }
            }
            return this.getWithAction(["takeUntil", predicate]);
        }
        drop(amount) {
            if (amount === Infinity)
                return Stream.empty();
            if (amount < 0 || !Number.isInteger(amount))
                throw new Error("Number of items to take must be a positive integer.");
            if (amount === 0)
                return this;
            if (this.savedNext.length) {
                amount--;
                this.savedNext.pop();
            }
            return this.getWithAction(["drop", amount]);
        }
        dropWhile(predicate) {
            if (this.savedNext.length) {
                if (predicate(this.savedNext[0])) {
                    this.savedNext.pop();
                }
                else {
                    return this;
                }
            }
            return this.getWithAction(["dropWhile", predicate]);
        }
        dropUntil(predicate) {
            if (this.savedNext.length) {
                if (!predicate(this.savedNext[0])) {
                    this.savedNext.pop();
                }
                else {
                    return this;
                }
            }
            return this.getWithAction(["dropUntil", predicate]);
        }
        step(step) {
            if (step === 1)
                // a step of 1 is default
                return this;
            if (step <= 0)
                // negative iteration is going to require getting the full array anyway, so we just reuse the array step functionality
                return StreamImplementation.values(this.toArray(), step);
            if (!Number.isInteger(step))
                throw new Error("Streams can only be stepped through with a nonzero integer.");
            let current = step;
            if (this.savedNext.length) {
                this.savedNext.pop();
                current--;
            }
            return this.getWithAction(["step", current, step]);
        }
        sort(comparator) {
            if (comparator === false)
                return this;
            return new StreamImplementation(this.toArray().sort(comparator)[Symbol.iterator]());
        }
        sortBy(mapper, comparator) {
            if (comparator === false)
                return this;
            const realComparator = comparator ? (([, a], [, b]) => comparator(a, b))
                : (([, a], [, b]) => a - b);
            return new StreamImplementation(this.toArray(value => [value, mapper(value)]).sort(realComparator)[Symbol.iterator]())
                .map(([value]) => value);
        }
        reverse() {
            return new StreamImplementation(this.toArray().reverse()[Symbol.iterator]());
        }
        distinct() {
            return new StreamImplementation(this.toSet().values());
        }
        shuffle(random) {
            return new StreamImplementation((0, Arrays_1.shuffle)(this.toArray(), random)[Symbol.iterator]());
        }
        partition(sorter, mapper) {
            return new Partitions_1.default(this, sorter, mapper, partitionStream => new StreamImplementation(partitionStream));
        }
        unzip() {
            return new UnzippedPartitions_1.default(this.flatMap(), partitionStream => new StreamImplementation(partitionStream));
        }
        add(...items) {
            return new StreamImplementation([this, items[Symbol.iterator]()]);
        }
        insert(...items) {
            return new StreamImplementation([items[Symbol.iterator](), this]);
        }
        insertAt(index, ...items) {
            return this.getWithAction(["insert", index, items]);
        }
        merge(...iterables) {
            return new StreamImplementation([this, ...iterables
                    .map(iterable => iterable instanceof StreamImplementation ? iterable : iterable[Symbol.iterator]())]);
        }
        collectStream() {
            return new StreamImplementation(this.toArray()[Symbol.iterator]());
        }
        entries() {
            let i = 0;
            return this.map(value => (0, Arrays_1.tuple)(i++, value));
        }
        ////////////////////////////////////
        // Collection
        //
        any(predicate) {
            let index = 0;
            while (true) {
                this.next();
                if (this.done) {
                    return false;
                }
                if (predicate(this.value, index++)) {
                    return true;
                }
            }
        }
        some(predicate) {
            return this.any(predicate);
        }
        every(predicate) {
            let index = 0;
            while (true) {
                this.next();
                if (this.done) {
                    return true;
                }
                if (!predicate(this.value, index++)) {
                    return false;
                }
            }
        }
        all(predicate) {
            return this.every(predicate);
        }
        none(predicate) {
            let index = 0;
            while (true) {
                this.next();
                if (this.done) {
                    return true;
                }
                if (predicate(this.value, index++)) {
                    return false;
                }
            }
        }
        includes(...values) {
            while (true) {
                this.next();
                if (this.done) {
                    return values.length === 0;
                }
                if (values.includes(this.value)) {
                    return true;
                }
            }
        }
        contains(...values) {
            return this.includes(...values);
        }
        has(...values) {
            return this.includes(...values);
        }
        includesAll(...values) {
            while (true) {
                this.next();
                if (this.done) {
                    return values.length === 0;
                }
                const i = values.indexOf(this.value);
                if (i > -1) {
                    values.splice(i, 1);
                    if (values.length === 0) {
                        return true;
                    }
                }
            }
        }
        containsAll(...values) {
            return this.includesAll(...values);
        }
        hasAll(...values) {
            return this.includesAll(...values);
        }
        // tslint:disable-next-line cyclomatic-complexity
        intersects(...iterables) {
            while (true) {
                this.next();
                if (this.done) {
                    return (iterables.length === 0);
                }
                for (let i = 0; i < iterables.length; i++) {
                    let iterable = iterables[i];
                    // the first time we check each iterable to see if it contains the current value, we
                    // turn it into an array (or leave sets) so we can take advantage of the (probably)
                    // faster native `includes`/`has` checking.
                    // however, we only loop through the iterable as much as is required -- if we happen
                    // to run into the current value, we return true then
                    if (!Array.isArray(iterable) && !(iterable instanceof Set)) {
                        const replacementArray = [];
                        for (const item of iterable) {
                            if (item === this.value) {
                                return true;
                            }
                            replacementArray.push(item);
                        }
                        iterable = iterables[i] = replacementArray;
                    }
                    if (Array.isArray(iterable)) {
                        if (iterable.includes(this.value)) {
                            return true;
                        }
                    }
                    else if (iterable instanceof Set) {
                        if (iterable.has(this.value)) {
                            return true;
                        }
                    }
                }
            }
        }
        count(predicate) {
            let i = 0;
            let count = 0;
            while (true) {
                this.next();
                if (this.done) {
                    return count;
                }
                if (!predicate || predicate(this.value, i)) {
                    count++;
                }
                i++;
            }
        }
        length() {
            return this.count();
        }
        size() {
            return this.count();
        }
        fold(initial, folder) {
            let index = 0;
            let value = initial;
            while (true) {
                this.next();
                if (this.done) {
                    return value;
                }
                value = folder(value, this.value, index++);
            }
        }
        reduce(reducer) {
            this.next();
            let index = 1;
            let value = this.value;
            while (true) {
                this.next();
                if (this.done) {
                    return value;
                }
                value = reducer(value, this.value, index++);
            }
        }
        first(predicate, orElse) {
            let index = 0;
            while (true) {
                this.next();
                if (this.done) {
                    return orElse ? orElse() : undefined;
                }
                if (!predicate || predicate(this.value, index++)) {
                    return this.value;
                }
            }
        }
        find(predicate, orElse) {
            return this.first(predicate, orElse);
        }
        last(predicate, orElse) {
            let index = 0;
            let last = LAST;
            while (true) {
                this.next();
                if (this.done) {
                    break;
                }
                if (!predicate || predicate(this.value, index++)) {
                    last = this.value;
                }
            }
            return last !== LAST ? last : orElse ? orElse() : undefined;
        }
        at(index, orElse) {
            if (!Number.isInteger(index)) {
                throw new Error("Can only retrieve values at integer indices.");
            }
            if (index >= 0)
                return this.drop(index).first(undefined, orElse);
            const array = this.toArray();
            index += array.length;
            if (index < 0)
                return orElse ? orElse() : undefined;
            return array[index];
        }
        random(random = Math.random, orElse) {
            if (!this.hasNext()) {
                return orElse ? orElse() : undefined;
            }
            return (0, Arrays_1.choice)([...this], random);
        }
        collect(collector, ...args) {
            return collector(this, ...args);
        }
        splat(collector, ...args) {
            return collector(...this.toArray(), ...args);
        }
        async race() {
            return Promise.race(this.toArray());
        }
        rest() {
            const arr = this.toArray();
            const promise = arr.length === 0 ? Promise.resolve(Stream.empty()) : Promise.all(arr)
                .then(results => new StreamImplementation(results[Symbol.iterator]()));
            if (arr.length === 0) {
                promise.isResolved = true;
            }
            return promise;
        }
        toArray(result = [], mapper) {
            if (typeof result === "function") {
                mapper = result;
                result = [];
            }
            let index = 0;
            while (true) {
                this.next();
                if (this.done) {
                    return result;
                }
                result.push(mapper ? mapper(this.value, index++) : this.value);
            }
        }
        toSet(result = new Set(), mapper) {
            if (typeof result === "function") {
                mapper = result;
                result = new Set();
            }
            let index = 0;
            while (true) {
                this.next();
                if (this.done) {
                    return result;
                }
                result.add(mapper ? mapper(this.value, index++) : this.value);
            }
        }
        toMap(result, mapper) {
            if (typeof result === "function") {
                mapper = result;
                result = new Map();
            }
            else if (result === undefined) {
                result = new Map();
            }
            let index = 0;
            while (true) {
                this.next();
                if (this.done) {
                    return result;
                }
                if (mapper) {
                    result.set(...mapper(this.value, index++));
                }
                else {
                    if (!Array.isArray(this.value)) {
                        throw new Error(`Can't convert the stream value "${this.value}" into a key-value pair.`);
                    }
                    result.set(...this.value);
                }
            }
        }
        toObject(result, mapper) {
            if (typeof result === "function") {
                mapper = result;
                result = {};
            }
            else if (result === undefined) {
                result = {};
            }
            let index = 0;
            while (true) {
                this.next();
                if (this.done) {
                    return result;
                }
                if (mapper) {
                    const [key, value] = mapper(this.value, index++);
                    result[`${key}`] = value;
                }
                else {
                    if (!Array.isArray(this.value)) {
                        throw new Error(`Can't convert the stream value "${this.value}" into a key-value pair.`);
                    }
                    const [key, value] = this.value;
                    result[`${key}`] = value;
                }
            }
        }
        toString(concatenator = "", startingValue) {
            let result;
            while (true) {
                this.next();
                if (this.done) {
                    return result === undefined ? ""
                        : typeof concatenator === "string" ? result.slice(concatenator.length) : result;
                }
                if (typeof concatenator === "string") {
                    if (result === undefined)
                        result = "";
                    result += `${concatenator}${this.value}`;
                }
                else {
                    if (result !== undefined)
                        result = concatenator(result, this.value);
                    else
                        result = typeof startingValue === "function" ? startingValue(this.value)
                            : startingValue === true ? `${this.value}`
                                : concatenator(startingValue, this.value);
                }
            }
        }
        min(mapper) {
            let minValue = Infinity;
            let minItem;
            let i = 0;
            while (true) {
                this.next();
                if (this.done) {
                    return minItem;
                }
                const value = mapper ? mapper(this.value, i++) : this.value;
                if (value < minValue) {
                    minValue = value;
                    minItem = this.value;
                }
            }
        }
        max(mapper) {
            let maxValue = -Infinity;
            let maxItem;
            let i = 0;
            while (true) {
                this.next();
                if (this.done) {
                    return maxItem;
                }
                const value = mapper ? mapper(this.value, i++) : this.value;
                if (value > maxValue) {
                    maxValue = value;
                    maxItem = this.value;
                }
            }
        }
        iterateToEnd() {
            while (true) {
                this.next();
                if (this.done) {
                    return;
                }
            }
        }
        finish() { this.iterateToEnd(); }
        end() { this.iterateToEnd(); }
        complete() { this.iterateToEnd(); }
        flush() { this.iterateToEnd(); }
        ////////////////////////////////////
        // Misc
        //
        forEach(user) {
            let index = 0;
            while (true) {
                this.next();
                if (this.done) {
                    return index;
                }
                user(this.value, index++);
            }
        }
        splatEach(user) {
            let index = 0;
            while (true) {
                this.next();
                if (this.done) {
                    return index;
                }
                const value = this.value;
                if (!(0, Iterables_1.isIterable)(value)) {
                    throw new Error(`This stream contains a non-iterable value (${value}), it can't be splatted into the user function.`);
                }
                index++;
                user(...value);
            }
        }
        // tslint:disable-next-line cyclomatic-complexity
        next() {
            if (this.doneNext || this.done) {
                this.done = true;
                return this;
            }
            if (this.savedNext.length) {
                this.value = this.savedNext.pop();
                return this;
            }
            if (!Array.isArray(this.iterators)) {
                this.iterators = [this.iterators];
            }
            FindNext: while (true) {
                const result = this.iterators[this.iteratorIndex].next();
                this.value = result.value;
                if (result.done) {
                    this.iteratorIndex++;
                    if (this.iteratorIndex >= this.iterators.length) {
                        ////////////////////////////////////
                        // "Last Chance" actions — actions that can extend the stream
                        //
                        if (this.actions) {
                            for (const action of this.actions) {
                                switch (action[0]) {
                                    case "insert": {
                                        this.iterators.push(action[2][Symbol.iterator]());
                                        action[0] = undefined;
                                        continue FindNext;
                                    }
                                }
                            }
                        }
                        ////////////////////////////////////
                        // We're out of values!
                        //
                        this.done = true;
                        return this;
                    }
                    continue;
                }
                if (this.actionsNeedDeleted) {
                    // delete any unused actions
                    for (let i = 0; i < this.actions.length; i++) {
                        const [actionType] = this.actions[i];
                        if (actionType === undefined) {
                            this.actions.splice(i, 1);
                            i--;
                        }
                    }
                    // this.actions = this.actions.filter(([actionType]) => actionType !== undefined);
                    this.actionsNeedDeleted = false;
                }
                if (this.actions) {
                    for (const action of this.actions) {
                        switch (action[0]) {
                            case "filter": {
                                const filter = action[1];
                                if (!filter(this.value, action[2]++)) {
                                    continue FindNext;
                                }
                                break;
                            }
                            case "map": {
                                const mapper = action[1];
                                this.value = mapper(this.value, action[2]++);
                                break;
                            }
                            case "take": {
                                // this "take" implementation is simple and fun, the way it works is it stores the number
                                // left to take in the action itself, so that every time it hits the "take" action, it checks
                                // if enough have been taken already. If not, it continues as per normal. Otherwise, it marks
                                // this stream as finishing on the next "next" call. (Before processing it.)
                                const amount = action[1];
                                if (amount === 1) {
                                    this.doneNext = true;
                                    return this;
                                }
                                action[1] = amount - 1;
                                break;
                            }
                            case "drop": {
                                // this is one more item to encounter, so we skip it and reduce the number we still need to skip by one
                                const amount = action[1]--;
                                // mark action for deletion when it won't need to be used anymore
                                if (amount === 1)
                                    action[0] = undefined;
                                // if there's more than zero items to drop, we skip this item and find the next
                                if (amount > 0)
                                    continue FindNext;
                                // the code should never get to this point
                                break;
                            }
                            case "takeWhile": {
                                const predicate = action[1];
                                if (!predicate(this.value)) {
                                    this.done = true;
                                    if (this.parent)
                                        this.parent.restreamCurrent();
                                    return this;
                                }
                                break;
                            }
                            case "takeUntil": {
                                const predicate = action[1];
                                if (predicate(this.value)) {
                                    this.done = true;
                                    if (this.parent)
                                        this.parent.restreamCurrent();
                                    return this;
                                }
                                break;
                            }
                            case "dropWhile": {
                                const predicate = action[1];
                                if (predicate(this.value)) {
                                    continue FindNext;
                                }
                                // we delete the action name, marking this action for removal
                                action[0] = undefined;
                                this.actionsNeedDeleted = true;
                                break;
                            }
                            case "dropUntil": {
                                const predicate = action[1];
                                if (!predicate(this.value)) {
                                    continue FindNext;
                                }
                                // we delete the predicate, marking this action for removal
                                action[0] = undefined;
                                this.actionsNeedDeleted = true;
                                break;
                            }
                            case "step": {
                                // this is a fun one too, so i'll explain how it works:
                                // 1. we store the "step size" and the "current step" in the action.
                                // - action[1] is the current,
                                // - action[2] is the size
                                // 2. when the action is performed, we subtract one from the current step
                                // 3. if the step is 0:
                                // - that means this current value is the new value
                                // - we reset the current step to the step size and allow it to continue again next time
                                // action[1] is the current step
                                action[1]--;
                                if (action[1] > 0) {
                                    continue FindNext;
                                }
                                // action[2] is the step size
                                action[1] = action[2];
                                break;
                            }
                            case "insert": {
                                // this is more to go before iterating over the inserted items, so we reduce the number remaining by one
                                const amount = action[1]--;
                                if (amount === 1) {
                                    // mark action for deletion, it won't need to be used anymore
                                    action[0] = undefined;
                                    // we're inserting our replacement stuff next
                                    this.iterators.splice(this.iteratorIndex, 0, action[2][Symbol.iterator]());
                                }
                                break;
                            }
                        }
                    }
                }
                // if we made it this far, we found the next value to return
                return this;
            }
        }
        hasNext() {
            if (!this.savedNext.length) {
                this.next();
                if (this.done) {
                    return false;
                }
                this.savedNext.push(this.value);
            }
            return true;
        }
        restreamCurrent() {
            this.savedNext.push(this.value);
            if (this.parent)
                this.parent.restreamCurrent();
        }
        getWithAction(action) {
            const newStream = new StreamImplementation(this, [action]);
            newStream.parent = this;
            return newStream;
        }
    }
    (function (StreamImplementation) {
        function is(value) {
            return value instanceof StreamImplementation;
        }
        StreamImplementation.is = is;
        function empty() {
            return new StreamImplementation();
        }
        StreamImplementation.empty = empty;
        function from(iterable) {
            if (typeof iterable === "function")
                iterable = iterable();
            if (iterable === undefined)
                return Stream.empty();
            if (iterable instanceof StreamImplementation)
                return iterable;
            if (Symbol.iterator in iterable)
                return new StreamImplementation(iterable[Symbol.iterator]());
            throw new Error(`Not an iterable value: ${iterable}`);
        }
        StreamImplementation.from = from;
        // tslint:disable-next-line no-shadowed-variable
        function iterators(...iterators) {
            return new StreamImplementation(...iterators);
        }
        StreamImplementation.iterators = iterators;
        function of(...args) {
            return new StreamImplementation(args[Symbol.iterator]());
        }
        StreamImplementation.of = of;
        function range(start, end, step = 1) {
            if (end === undefined) {
                end = start;
                start = 0;
            }
            return new StreamImplementation((0, RangeStream_1.default)(start, end, step));
        }
        StreamImplementation.range = range;
        function entries(obj, step = 1) {
            if (obj === undefined) {
                return of();
            }
            if (obj instanceof Map) {
                return new StreamImplementation(obj.entries());
            }
            if (Array.isArray(obj)) {
                return new StreamImplementation(new ArrayStream_1.ArrayEntriesStream(obj, step));
            }
            // todo: the following call can probably be made more efficient by looping the entries of the object manually
            // rather than calling `Object.entries` and making a Stream from that result array
            return from(Object.entries(obj));
        }
        StreamImplementation.entries = entries;
        function keys(obj) {
            if (obj instanceof Map) {
                return new StreamImplementation(obj.keys());
            }
            // todo: the following call can probably be made more efficient by looping the keys of the object manually
            // rather than calling `Object.keys` and making a Stream from that result array
            return from(Object.keys(obj));
        }
        StreamImplementation.keys = keys;
        function values(obj, step = 1) {
            if (obj instanceof Map) {
                return new StreamImplementation(obj.values());
            }
            if (Array.isArray(obj)) {
                if (step === 1) {
                    return from(obj);
                }
                return new StreamImplementation(new ArrayStream_1.ArrayStream(obj, step));
            }
            // todo: the following call can probably be made more efficient by looping the values of the object manually
            // rather than calling `Object.values` and making a Stream from that result array
            return from(Object.values(obj));
        }
        StreamImplementation.values = values;
        /**
         * Takes two iterables representing "keys" and "values", and turns them into a Stream of 2-value tuples. The resulting
         * Stream will end when either of the iterables runs out of items. (Its size will be that of the smaller of the two
         * input iterables/streams).
         */
        function zip(keysIterable, valuesIterable) {
            const valueStream = valuesIterable instanceof StreamImplementation ? new StreamImplementation(valuesIterable) : from(valuesIterable);
            return (keysIterable instanceof StreamImplementation ? new StreamImplementation(keysIterable) : from(keysIterable))
                .takeWhile(() => {
                valueStream.next();
                return !valueStream.done;
            })
                .map((key) => (0, Arrays_1.tuple)(key, valueStream.value));
        }
        StreamImplementation.zip = zip;
    })(StreamImplementation || (StreamImplementation = {}));
    const Stream = StreamImplementation;
    exports.default = Stream;
});
