declare global {
    interface Set<T> {
        add(...values: T[]): this;
        delete(...values: T[]): boolean;
        toggle(has: boolean, ...values: T[]): this;
    }
}
export {};
