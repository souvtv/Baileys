export class CacheStore<K = any> {
    private ttl: number | undefined
    private timeoutHandles: Map<string, NodeJS.Timeout> = new Map()

    private store: Map<string, unknown> = new Map()

    constructor(params?: { ttl?: number }) {
        this.ttl = params?.ttl && (params.ttl * 1000)  // convert seconds to milliseconds
    }

    async get<T = K>(key: string): Promise<T | undefined> {
        const value = this.store.get(key)
        if (!value) {
            return
        }

        return value as T
    }

    async set<T>(key: string, value: T): Promise<void> {
        this.store.set(key, value)

        if (this.ttl) {
            // apply TTL
            clearTimeout(this.timeoutHandles.get(key))
            this.timeoutHandles.set(key, setTimeout(() => {
                this.store.delete(key)
            }, this.ttl)
            )
        }
    }

    async del(key: string): Promise<void> {
        this.store.delete(key)
        clearTimeout(this.timeoutHandles.get(key))
    }


    async mget<T = K>(keys: string[]): Promise<Record<string, T | undefined>> {
        const result: Record<string, T | undefined> = {}
        for (const key of keys) {
            result[key] = await this.get(key)
        }
        return result
    }

    mset<T>(entries: { key: string; value: T }[]): Promise<void> | void | number | boolean {
        for (const { key, value } of entries) {
            this.set(key, value)
        }
    }

    mdel(keys: string[]): void | Promise<void> | number | boolean {
        for (const key of keys) {
            this.del(key)
        }
    }


    async flushAll(): Promise<void> {
        this.store.clear()
        this.timeoutHandles.forEach(handle => clearTimeout(handle))
        this.timeoutHandles.clear()
    }
}