export class CacheStore {
    constructor(params) {
        this.timeoutHandles = new Map();
        this.store = new Map();
        this.ttl = params?.ttl && (params.ttl * 1000); // convert seconds to milliseconds
    }
    async get(key) {
        const value = this.store.get(key);
        if (!value) {
            return;
        }
        return value;
    }
    async set(key, value) {
        this.store.set(key, value);
        if (this.ttl) {
            // apply TTL
            clearTimeout(this.timeoutHandles.get(key));
            this.timeoutHandles.set(key, setTimeout(() => {
                this.store.delete(key);
            }, this.ttl));
        }
    }
    async del(key) {
        this.store.delete(key);
        clearTimeout(this.timeoutHandles.get(key));
    }
    async mget(keys) {
        const result = {};
        for (const key of keys) {
            result[key] = await this.get(key);
        }
        return result;
    }
    mset(entries) {
        for (const { key, value } of entries) {
            this.set(key, value);
        }
    }
    mdel(keys) {
        for (const key of keys) {
            this.del(key);
        }
    }
    async flushAll() {
        this.store.clear();
        this.timeoutHandles.forEach(handle => clearTimeout(handle));
        this.timeoutHandles.clear();
    }
}
