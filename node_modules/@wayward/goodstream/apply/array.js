(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./array/collect", "./array/filter", "./array/indexing", "./array/minMax", "./array/spliceWhere", "./array/stream", "./array/toMap", "./array/toObject", "./array/toSet"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    require("./array/collect");
    require("./array/filter");
    require("./array/indexing");
    require("./array/minMax");
    require("./array/spliceWhere");
    require("./array/stream");
    require("./array/toMap");
    require("./array/toObject");
    require("./array/toSet");
});
