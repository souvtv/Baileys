export declare class CacheStore<K = any> {
    private ttl;
    private timeoutHandles;
    private store;
    constructor(params?: {
        ttl?: number;
    });
    get<T = K>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T): Promise<void>;
    del(key: string): Promise<void>;
    mget<T = K>(keys: string[]): Promise<Record<string, T | undefined>>;
    mset<T>(entries: {
        key: string;
        value: T;
    }[]): Promise<void> | void | number | boolean;
    mdel(keys: string[]): void | Promise<void> | number | boolean;
    flushAll(): Promise<void>;
}
