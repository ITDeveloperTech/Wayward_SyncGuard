(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./map/getOrDefault", "./map/retainWhere", "./map/stream", "./map/toggle"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    require("./map/getOrDefault");
    require("./map/retainWhere");
    require("./map/stream");
    require("./map/toggle");
});
