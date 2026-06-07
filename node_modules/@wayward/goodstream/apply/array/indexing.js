var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../../util/Define"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Define_1 = __importDefault(require("../../util/Define"));
    (0, Define_1.default)(Array.prototype, "first", function (mapper) {
        if (!this.length)
            return undefined;
        const value = this[0];
        return mapper ? mapper(value) : value;
    });
    (0, Define_1.default)(Array.prototype, "last", function (mapper) {
        if (!this.length)
            return undefined;
        const value = this[this.length - 1];
        return mapper ? mapper(value) : value;
    });
    (0, Define_1.default)(Array.prototype, "at", function (index, mapper) {
        index = index < 0 ? this.length + index : index;
        if (index < 0 || index >= this.length)
            return undefined;
        const value = this[index];
        return mapper ? mapper(value) : value;
    });
});
