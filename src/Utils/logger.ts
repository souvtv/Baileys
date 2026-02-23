

export interface ILogger {
	level: string
	child(obj: Record<string, unknown>): ILogger
	trace(obj: unknown, msg?: string): void
	debug(obj: unknown, msg?: string): void
	info(obj: unknown, msg?: string): void
	warn(obj: unknown, msg?: string): void
	error(obj: unknown, msg?: string): void
}

const P = <ILogger>{
	level: 'trace',
	child: () => P,
	trace: console.debug,
	debug: console.debug,
	info: console.info,
	warn: console.warn,
	error: console.error
}

export default P
