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
    (0, Define_1.default)(Array.prototype, "spliceWhere", function (predicate) {
        // choose the faster method based on the array length
        if (this.length > 10) {
            let i = 0;
            this.splice(0, Infinity, ...this.filter(v => !predicate(v, i++)));
        }
        else {
            for (let i = 0; i < this.length; i++) {
                if (predicate(this[i], i)) {
                    this.splice(i--, 1);
                }
            }
        }
        return this;
    });
});
