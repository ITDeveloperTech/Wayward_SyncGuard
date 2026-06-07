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
    exports.shuffle = shuffle;
    exports.tuple = tuple;
    exports.choice = choice;
    /**
     * Shuffles the contents of the given array using the Fisher-Yates Shuffle: https://bost.ocks.org/mike/shuffle/
     * @returns The given array after shuffling its contents.
     */
    function shuffle(arr, r = Math.random) {
        let currentIndex = arr.length;
        let temporaryValue;
        let randomIndex;
        while (0 !== currentIndex) {
            randomIndex = randomInt(r, currentIndex);
            currentIndex -= 1;
            temporaryValue = arr[currentIndex];
            arr[currentIndex] = arr[randomIndex];
            arr[randomIndex] = temporaryValue;
        }
        return arr;
    }
    function tuple(...items) {
        return items;
    }
    function choice(arr, r = Math.random) {
        return arr.length === 0 ? undefined : arr[randomInt(r, arr.length)];
    }
    function randomInt(randomFunction, max) {
        return Math.floor(randomFunction() * max);
    }
});
