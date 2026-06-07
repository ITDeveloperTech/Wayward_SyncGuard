var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./util/Arrays", "./util/decorator/Override"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ArrayEntriesStream = exports.ArrayStream = void 0;
    const Arrays_1 = require("./util/Arrays");
    const Override_1 = require("./util/decorator/Override");
    class ArrayStream {
        array;
        done = false;
        value;
        index;
        step;
        constructor(array, step) {
            this.array = array;
            if (step === 0 || !Number.isInteger(step)) {
                throw new Error(`Step "${step}" is invalid. Must be a non-zero positive or negative integer.`);
                step = 1;
            }
            this.step = step;
            this.index = step > 0 ? -1 : array.length;
        }
        next() {
            if (!this.done) {
                this.index += this.step;
                this.value = this.getValue();
                if (this.step > 0 ? this.index >= this.array.length : this.index < 0) {
                    this.done = true;
                }
            }
            return this;
        }
        getValue() {
            return this.array[this.index];
        }
    }
    exports.ArrayStream = ArrayStream;
    class ArrayEntriesStream extends ArrayStream {
        getValue() {
            return (0, Arrays_1.tuple)(this.index, this.array[this.index]);
        }
    }
    exports.ArrayEntriesStream = ArrayEntriesStream;
    __decorate([
        Override_1.Override
    ], ArrayEntriesStream.prototype, "getValue", null);
});
