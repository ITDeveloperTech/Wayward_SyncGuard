(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./apply/array", "./apply/function", "./apply/iterableIterator", "./apply/map", "./apply/regex", "./apply/set"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    require("./apply/array");
    require("./apply/function");
    require("./apply/iterableIterator");
    require("./apply/map");
    require("./apply/regex");
    require("./apply/set");
});
