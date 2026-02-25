export default class EventEmitter {
    constructor() {
        this.listeners = new Map();
    }
    on(event, listener) {
        const existing = this.listeners.get(event);
        if (existing) {
            existing.add(listener);
            return;
        }
        this.listeners.set(event, new Set([listener]));
    }
    once(event, listener) {
        const onceListener = (arg) => {
            listener(arg);
            this.off(event, onceListener);
        };
        this.on(event, onceListener);
    }
    off(event, listener) {
        const existing = this.listeners.get(event);
        if (!existing) {
            return;
        }
        existing.delete(listener);
        if (!existing.size) {
            this.listeners.delete(event);
        }
    }
    removeAllListeners(event) {
        if (typeof event === 'undefined') {
            this.listeners.clear();
            return;
        }
        this.listeners.delete(event);
    }
    emit(event, arg) {
        const existing = this.listeners.get(event);
        if (!existing || !existing.size) {
            return false;
        }
        for (const listener of existing) {
            listener(arg);
        }
        return true;
    }
}
export const once = (emitter, event) => {
    return new Promise((resolve) => emitter?.once?.(event, resolve));
};
