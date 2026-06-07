declare global {
    interface Function {
        dropFirst<A extends any[], R>(this: (...args: A) => R): (a: any, ...args: A) => R;
        dropParams<A extends any[], R>(this: (...args: A) => R, amt: 1): (a: any, ...args: A) => R;
        dropParams<A extends any[], R>(this: (...args: A) => R, amt: 2): (a: any, b: any, ...args: A) => R;
        dropParams<A extends any[], R>(this: (...args: A) => R, amt: 3): (a: any, b: any, c: any, ...args: A) => R;
        dropParams<A extends any[], R>(this: (...args: A) => R, amt: 4): (a: any, b: any, c: any, d: any, ...args: A) => R;
        dropParams<A extends any[], R>(this: (...args: A) => R, amt: 5): (a: any, b: any, c: any, d: any, e: any, ...args: A) => R;
    }
}
export {};
