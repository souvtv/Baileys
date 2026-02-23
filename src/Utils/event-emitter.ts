type Listener<T = unknown> = (arg: T) => void

type ListenerMap = Map<PropertyKey, Set<Listener>>

export default class EventEmitter {
    private listeners: ListenerMap = new Map()

    on<T = unknown>(event: PropertyKey, listener: Listener<T>): void {
        const existing = this.listeners.get(event)
        if (existing) {
            existing.add(listener as Listener)
            return
        }

        this.listeners.set(event, new Set([listener as Listener]))
    }

    once<T = unknown>(event: PropertyKey, listener: Listener<T>): void {
        const onceListener: Listener<T> = (arg) => {
            listener(arg)
            this.off(event, onceListener)
        }
        this.on(event, onceListener)
    }

    off<T = unknown>(event: PropertyKey, listener: Listener<T>): void {
        const existing = this.listeners.get(event)
        if (!existing) {
            return
        }

        existing.delete(listener as Listener)
        if (!existing.size) {
            this.listeners.delete(event)
        }
    }

    removeAllListeners(event?: PropertyKey): void {
        if (typeof event === 'undefined') {
            this.listeners.clear()
            return
        }

        this.listeners.delete(event)
    }

    emit<T = unknown>(event: PropertyKey, arg?: T): boolean {
        const existing = this.listeners.get(event)
        if (!existing || !existing.size) {
            return false
        }

        for (const listener of existing) {
            listener(arg)
        }

        return true
    }
}

export const once = <T = unknown>(emitter: any, event: PropertyKey) => {
    return new Promise<T>((resolve) => emitter?.once?.(event, resolve))
}