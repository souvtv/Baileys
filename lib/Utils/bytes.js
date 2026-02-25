import { Buffer } from 'buffer';
export const isBufferJson = (data) => {
    if (!data || typeof data !== 'object')
        return false;
    if (data.type !== 'Buffer')
        return false;
    const inner = data.data;
    return ((typeof inner === 'string' && inner.length > 0) ||
        (Array.isArray(inner) && inner.every((n) => typeof n === 'number')));
};
export const toBytes = (data, label = 'bytes') => {
    if (data === undefined)
        return undefined;
    if (data instanceof Uint8Array)
        return Uint8Array.from(data);
    if (Buffer.isBuffer(data))
        return Uint8Array.from(data);
    if (typeof data === 'string')
        return new TextEncoder().encode(data);
    if (data instanceof ArrayBuffer)
        return new Uint8Array(data);
    if (ArrayBuffer.isView(data))
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    if (isBufferJson(data)) {
        return typeof data.data === 'string' ? Buffer.from(data.data, 'base64') : Uint8Array.from(data.data);
    }
    if (Array.isArray(data) && data.every(n => typeof n === 'number'))
        return Uint8Array.from(data);
    throw new Error(`expected bytes for ${label} ${typeof data}`);
};
export const toBuffer = (data, label = 'bytes') => {
    const bytes = toBytes(data, label);
    return Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
};
