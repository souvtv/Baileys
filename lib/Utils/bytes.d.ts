import { Buffer } from 'buffer';
import type { BinaryNode } from '../WABinary/types.js';
export type BufferJson = {
    type: 'Buffer';
    data: number[] | string;
};
export declare const isBufferJson: (data: unknown) => data is BufferJson;
export declare const toBytes: <T extends string | Buffer | ArrayBuffer | ArrayBufferView | Uint8Array | BufferJson | BinaryNode[] | undefined>(data: T, label?: string) => Uint8Array;
export declare const toBuffer: (data: string | Buffer | ArrayBuffer | ArrayBufferView | Uint8Array | BufferJson | BinaryNode[] | undefined, label?: string) => Buffer;
