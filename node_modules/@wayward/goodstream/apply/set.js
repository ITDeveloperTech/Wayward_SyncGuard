(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./set/deleteWhere", "./set/manipulate", "./set/manipulateFrom", "./set/retainNot", "./set/retainWhere", "./set/stream"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    require("./set/deleteWhere");
    require("./set/manipulate");
    require("./set/manipulateFrom");
    require("./set/retainNot");
    require("./set/retainWhere");
    require("./set/stream");
});
