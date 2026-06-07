export type Implementation<P, K extends keyof P> = (this: P, ...args: P[K] extends (...args: infer A) => any ? A : []) => P[K] extends (...args: any[]) => infer R ? R : never;
declare function Define<P, K extends keyof P>(proto: P, key: K, implementation: Implementation<P, K>): void;
declare namespace Define {
    function all<P, K extends keyof P>(protos: P[], key: K, implementation: Implementation<P, K>): void;
}
export default Define;
