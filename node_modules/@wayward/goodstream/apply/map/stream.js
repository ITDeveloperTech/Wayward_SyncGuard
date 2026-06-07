var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../../Stream", "../../util/Define"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Stream_1 = __importDefault(require("../../Stream"));
    const Define_1 = __importDefault(require("../../util/Define"));
    (0, Define_1.default)(Map.prototype, "valueStream", function () {
        return Stream_1.default.from(this.values());
    });
    (0, Define_1.default)(Map.prototype, "keyStream", function () {
        return Stream_1.default.from(this.keys());
    });
    (0, Define_1.default)(Map.prototype, "entryStream", function () {
        return Stream_1.default.from(this);
    });
});
