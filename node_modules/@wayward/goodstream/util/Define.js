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
    function Define(proto, key, implementation) {
        try {
            Object.defineProperty(proto, key, {
                configurable: true,
                writable: true,
                value: implementation,
            });
        }
        catch (err) {
            console.error(`Unable to apply prototype ${proto.constructor.name}["${String(key)}"]`, err);
        }
    }
    (function (Define) {
        function all(protos, key, implementation) {
            for (const proto of protos)
                Define(proto, key, implementation);
        }
        Define.all = all;
    })(Define || (Define = {}));
    exports.default = Define;
});
