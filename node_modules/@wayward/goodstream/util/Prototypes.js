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
    exports.PROTOTYPES_ITERABLE_ITERATOR = void 0;
    exports.PROTOTYPES_ITERABLE_ITERATOR = [
        Object.getPrototypeOf(function* () { }).prototype,
        Object.getPrototypeOf([][Symbol.iterator]()),
        Object.getPrototypeOf(new Map()[Symbol.iterator]()),
        Object.getPrototypeOf(new Set()[Symbol.iterator]()),
        Object.getPrototypeOf(""[Symbol.iterator]()),
    ];
});
