import EventEmitter from '../../Utils/event-emitter'
import type { SocketConfig } from '../../Types'
import type { Buffer } from 'buffer'

export abstract class AbstractSocketClient extends EventEmitter {
	abstract get isOpen(): boolean
	abstract get isClosed(): boolean
	abstract get isClosing(): boolean
	abstract get isConnecting(): boolean

	constructor(
		public url: URL,
		public config: SocketConfig
	) {
		super()
	}

	abstract connect(): void
	abstract close(): void
	abstract send(str: string | BufferSource, cb?: (err?: Error) => void): boolean
}
