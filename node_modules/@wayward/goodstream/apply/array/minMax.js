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
    (0, Define_1.default)(Array.prototype, "min", function (mapper) {
        if (!mapper) {
            return Math.min(...this);
        }
        let minValue = Infinity;
        let minItem;
        let i = 0;
        for (const item of this) {
            const value = mapper(item, i++);
            if (value < minValue) {
                minValue = value;
                minItem = item;
            }
        }
        return minItem;
    });
    (0, Define_1.default)(Array.prototype, "max", function (mapper) {
        if (!mapper) {
            return Math.max(...this);
        }
        let maxValue = -Infinity;
        let maxItem;
        let i = 0;
        for (const item of this) {
            const value = mapper(item, i++);
            if (value > maxValue) {
                maxValue = value;
                maxItem = item;
            }
        }
        return maxItem;
    });
});
