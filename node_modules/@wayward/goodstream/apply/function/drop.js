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
    (0, Define_1.default)(Function.prototype, "dropFirst", function () {
        const functionToCall = this;
        return function (...args) {
            return functionToCall.apply(this, args.slice(1));
        };
    });
    (0, Define_1.default)(Function.prototype, "dropParams", function (amt) {
        const functionToCall = this;
        return function (...args) {
            return functionToCall.apply(this, args.slice(amt));
        };
    });
});
