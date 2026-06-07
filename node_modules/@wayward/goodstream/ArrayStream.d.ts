export declare class ArrayStream<T, R = T> implements Iterator<R> {
    protected readonly array: T[];
    done: boolean;
    value: R;
    protected index: number;
    private readonly step;
    constructor(array: T[], step: number);
    next(): this;
    protected getValue(): R;
}
export declare class ArrayEntriesStream<T> extends ArrayStream<T, [number, T]> {
    getValue(): [number, T];
}
