import { AbstractSocketClient } from './types.js';
export class WebSocketClient extends AbstractSocketClient {
    constructor() {
        super(...arguments);
        this.socket = null;
    }
    get isOpen() {
        return this.socket?.readyState === WebSocket.OPEN;
    }
    get isClosed() {
        return this.socket === null || this.socket?.readyState === WebSocket.CLOSED;
    }
    get isClosing() {
        return this.socket === null || this.socket?.readyState === WebSocket.CLOSING;
    }
    get isConnecting() {
        return this.socket?.readyState === WebSocket.CONNECTING;
    }
    connect() {
        if (this.socket) {
            return;
        }
        this.socket = new WebSocket(this.url);
        // {
        // 	origin: DEFAULT_ORIGIN,
        // 	headers: this.config.options?.headers as {},
        // 	handshakeTimeout: this.config.connectTimeoutMs,
        // 	timeout: this.config.connectTimeoutMs,
        // 	agent: this.config.agent
        // }
        // this.socket.setMaxListeners(0)
        this.socket?.addEventListener('close', (closeEv) => {
            this.emit('close', closeEv);
        });
        this.socket?.addEventListener('error', (err) => {
            this.emit('error', err);
        });
        this.socket?.addEventListener('message', async (ev) => {
            const data = ev.data;
            const _data = typeof data === 'string' ? data : (data instanceof Blob ? await data.arrayBuffer() : ev.data);
            this.emit('message', _data);
        });
        this.socket?.addEventListener('open', () => {
            this.emit('open');
        });
    }
    async close() {
        if (!this.socket) {
            return;
        }
        const closePromise = new Promise(resolve => {
            const cb = () => {
                resolve();
                this.socket?.removeEventListener('close', () => { });
            };
            this.socket?.addEventListener('close', cb);
        });
        this.socket.close();
        await closePromise;
        this.socket = null;
    }
    send(str) {
        this.socket?.send(str);
        return Boolean(this.socket);
    }
}
