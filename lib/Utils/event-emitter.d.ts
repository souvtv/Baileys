type Listener<T = unknown> = (arg: T) => void;
export default class EventEmitter {
    private listeners;
    on<T = unknown>(event: PropertyKey, listener: Listener<T>): void;
    once<T = unknown>(event: PropertyKey, listener: Listener<T>): void;
    off<T = unknown>(event: PropertyKey, listener: Listener<T>): void;
    removeAllListeners(event?: PropertyKey): void;
    emit<T = unknown>(event: PropertyKey, arg?: T): boolean;
}
export declare const once: <T = unknown>(emitter: any, event: PropertyKey) => Promise<T>;
export {};
