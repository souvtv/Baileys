import EventEmitter from '../../Utils/event-emitter.js';
import type { SocketConfig } from '../../Types/index.js';
export declare abstract class AbstractSocketClient extends EventEmitter {
    url: URL;
    config: SocketConfig;
    abstract get isOpen(): boolean;
    abstract get isClosed(): boolean;
    abstract get isClosing(): boolean;
    abstract get isConnecting(): boolean;
    constructor(url: URL, config: SocketConfig);
    abstract connect(): void;
    abstract close(): void;
    abstract send(str: string | BufferSource, cb?: (err?: Error) => void): boolean;
}
