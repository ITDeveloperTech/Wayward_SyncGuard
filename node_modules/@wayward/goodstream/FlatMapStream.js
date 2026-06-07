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
    class FlatMapStream {
        stream;
        mapper;
        value;
        done = false;
        subIterable;
        index = 0;
        constructor(stream, mapper) {
            this.stream = stream;
            this.mapper = mapper;
        }
        next() {
            while (true) {
                while (!this.subIterable) {
                    const result = this.stream.next();
                    if (result.done) {
                        this.done = true;
                        return this;
                    }
                    let nextPotentialSubiterable = result.value;
                    if (this.mapper) {
                        nextPotentialSubiterable = this.mapper(result.value, this.index++);
                    }
                    if (typeof nextPotentialSubiterable !== "object" || !(Symbol.iterator in nextPotentialSubiterable)) {
                        // we allow "flatMap" to be called on Streams containing `X | Iterable<X>` currently
                        // if we don't want that, we can uncomment the following lines:
                        // Log.warn(LogSource.Utilities, "Stream")("Can't use flat map on item, not iterable: ", this.stream.value);
                        // continue;
                        this.subIterable = [nextPotentialSubiterable][Symbol.iterator]();
                    }
                    else {
                        this.subIterable = nextPotentialSubiterable[Symbol.iterator]();
                    }
                }
                const value = this.subIterable.next();
                if (value.done) {
                    this.subIterable = undefined;
                    continue;
                }
                this.value = value.value;
                return this;
            }
        }
    }
    exports.default = FlatMapStream;
});
