var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../../Stream", "../../util/Define", "../../util/Prototypes"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Stream_1 = __importDefault(require("../../Stream"));
    const Define_1 = __importDefault(require("../../util/Define"));
    const Prototypes_1 = require("../../util/Prototypes");
    const methods = [
        "filter",
        "filter2",
        "filterNullish",
        "filterFalsey",
        "map",
        "flatMap",
        "take",
        "takeWhile",
        "takeUntil",
        "drop",
        "dropWhile",
        "dropUntil",
        "step",
        "sort",
        "sortBy",
        "reverse",
        "distinct",
        "shuffle",
        "partition",
        "unzip",
        "add",
        "merge",
        "insert",
        "insertAt",
        "collectStream",
        "entries",
        "any",
        "some",
        "every",
        "all",
        "none",
        "includes",
        "contains",
        "has",
        "includesAll",
        "containsAll",
        "hasAll",
        "intersects",
        "count",
        "length",
        "size",
        "fold",
        "reduce",
        "first",
        "find",
        "last",
        "at",
        "random",
        "collect",
        "splat",
        "race",
        "rest",
        "toArray",
        "toSet",
        "toMap",
        "toObject",
        "toString",
        "min",
        "max",
        "iterateToEnd",
        "finish",
        "end",
        "complete",
        "flush",
        "forEach",
        "splatEach",
        "hasNext",
    ];
    for (const method of methods) {
        Define_1.default.all(Prototypes_1.PROTOTYPES_ITERABLE_ITERATOR, method, function (...args) {
            return Stream_1.default.from(this)[method](...args);
        });
    }
});
