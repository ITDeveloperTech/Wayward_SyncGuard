declare global {
    interface Map<K, V> {
        toggle(has: boolean, key: K, value: V): this;
    }
}
export {};
