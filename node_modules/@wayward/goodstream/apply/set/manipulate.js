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
    const originalAdd = Set.prototype.add;
    (0, Define_1.default)(Set.prototype, "add", function (...values) {
        for (const value of values)
            originalAdd.call(this, value);
        return this;
    });
    const originalDelete = Set.prototype.delete;
    (0, Define_1.default)(Set.prototype, "delete", function (...values) {
        let deleted = false;
        for (const value of values)
            if (originalDelete.call(this, value))
                deleted = true;
        return deleted;
    });
    (0, Define_1.default)(Set.prototype, "toggle", function (has, ...values) {
        if (has)
            this.add(...values);
        else
            this.delete(...values);
        return this;
    });
});
