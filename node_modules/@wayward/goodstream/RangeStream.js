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
    exports.default = rangeIterator;
    function rangeIterator(start, end, step) {
        let result;
        if (end === start) {
            result = { done: true, value: NaN };
        }
        else {
            if (step === 0) {
                throw new Error("Step must be non-zero.");
            }
            if (step < 0) {
                const oldStart = start;
                start = end;
                end = oldStart;
            }
            step = Math.abs(step) * (start > end ? -1 : 1);
            result = { done: false, value: start - step };
        }
        if (step > 0) {
            return {
                next() {
                    if (!result.done) {
                        result.value += step;
                        if (result.value >= end) {
                            result.done = true;
                        }
                    }
                    return result;
                },
            };
        }
        else {
            return {
                next() {
                    if (!result.done) {
                        result.value += step;
                        if (result.value <= end) {
                            result.done = true;
                        }
                    }
                    return result;
                },
            };
        }
    }
});
