declare global {
    interface Set<T> {
        addFrom(...iterables: Iterable<T>[]): this;
        deleteFrom(...iterables: Iterable<T>[]): boolean;
        toggleFrom(has: boolean, ...iterables: Iterable<T>[]): this;
    }
}
export {};
