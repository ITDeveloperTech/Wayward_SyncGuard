export default class FlatMapStream<T, R> implements Iterator<R> {
    private readonly stream;
    private readonly mapper?;
    value: R;
    done: boolean;
    private subIterable;
    private index;
    constructor(stream: Iterator<T>, mapper?: ((value: T, index: number) => Iterable<R>) | undefined);
    next(): this;
}
