var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../../Stream", "../../util/Define", "../../util/Prototypes"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Stream_1 = __importDefault(require("../../Stream"));
    const Define_1 = __importDefault(require("../../util/Define"));
    const Prototypes_1 = require("../../util/Prototypes");
    Define_1.default.all(Prototypes_1.PROTOTYPES_ITERABLE_ITERATOR, "stream", function () {
        return Stream_1.default.from(this);
    });
});
