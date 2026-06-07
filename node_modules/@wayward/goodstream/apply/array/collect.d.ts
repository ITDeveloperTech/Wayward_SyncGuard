declare global {
    interface Array<T> {
        /**
         * Returns a value of type X, generated with the given collector function.
         * @param collector A function that takes the iterable, and returns type X
         */
        collect<X>(collector: (val: T[]) => X): X;
        /**
         * Returns a value of type X, generated with the given collector function.
         * @param collector A function that takes the iterable, and returns type X
         */
        collect<X, A extends any[]>(collector: (val: T[], ...args: A) => X, ...args: A): X;
        /**
         * Returns a value of type X, generated with the given collector function.
         * @param collector A function that takes the values of the array, and returns type X
         */
        splat<X>(collector: (...val: T[]) => X): X;
        /**
         * Returns a value of type X, generated with the given collector function.
         * @param collector A function that takes the values of the array, and returns type X
         */
        splat<X>(collector: (...val: T[]) => X, ...args: T[]): X;
    }
    interface ReadonlyArray<T> {
        /**
         * Returns a value of type X, generated with the given collector function.
         * @param collector A function that takes the iterable, and returns type X
         */
        collect<X>(collector: (val: T[]) => X): X;
        /**
         * Returns a value of type X, generated with the given collector function.
         * @param collector A function that takes the iterable, and returns type X
         */
        collect<X, A extends any[]>(collector: (val: T[], ...args: A) => X, ...args: A): X;
        /**
         * Returns a value of type X, generated with the given collector function.
         * @param collector A function that takes the values of the array, and returns type X
         */
        splat<X>(collector: (...val: T[]) => X): X;
        /**
         * Returns a value of type X, generated with the given collector function.
         * @param collector A function that takes the values of the array, and returns type X
         */
        splat<X>(collector: (...val: T[]) => X, ...args: T[]): X;
    }
}
export {};
