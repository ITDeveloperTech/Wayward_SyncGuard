var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./Partitions"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Partitions_1 = __importDefault(require("./Partitions"));
    class UnzippedPartitionsImplementation extends Partitions_1.default {
        constructor(stream, streamMapper) {
            super(stream.flatMap(), (value, index) => index % 2 ? "value" : "key", undefined, streamMapper);
            // initialize partitions for "key" and "value" so they appear in the `.partitions()` stream
            this.get("key");
            this.get("value");
        }
        keys() {
            return this.get("key");
        }
        values() {
            return this.get("value");
        }
    }
    const UnzippedPartitions = UnzippedPartitionsImplementation;
    exports.default = UnzippedPartitions;
});
