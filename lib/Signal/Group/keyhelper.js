import { randomInt, randomBytes } from 'crypto';
import { generateKeyPair } from 'libsignal/src/curve.js';
import { Buffer } from 'buffer';
export function generateSenderKey() {
    return randomBytes(32);
}
export function generateSenderKeyId() {
    return randomInt(2147483647);
}
export function generateSenderSigningKey(key) {
    if (!key) {
        key = generateKeyPair();
    }
    return {
        public: Buffer.from(key.pubKey),
        private: Buffer.from(key.privKey)
    };
}
