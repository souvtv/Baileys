import * as curve from 'libsignal/src/curve.js';
import { KEY_BUNDLE_TYPE } from '../Defaults/index.js';
import { toBuffer, toBytes } from './bytes.js';
import { hmac } from '@noble/hashes/hmac.js';
import { cbc, ctr, gcm } from '@noble/ciphers/aes.js';
import { hkdf as _hkdf } from '@noble/hashes/hkdf.js';
import { sha256 as hashSha256, sha512 as hashSha512 } from '@noble/hashes/sha2.js';
import { randomBytes } from '@noble/ciphers/utils.js';
// insure browser & node compatibility
const { subtle } = globalThis.crypto;
export const hkdf = (buffer, expanded_length, opt) => {
    const _buffer = toBytes(buffer, 'buffer');
    const salt = opt.salt;
    const info = opt.info ? toBytes(opt.info) : undefined;
    return _hkdf(hashSha256, _buffer, salt, info, expanded_length);
};
/** prefix version byte to the pub keys, required for some curve crypto functions */
export const generateSignalPubKey = (pubKey) => pubKey.length === 33 ? pubKey : Buffer.concat([KEY_BUNDLE_TYPE, pubKey]);
export const Curve = {
    generateKeyPair: () => {
        const { pubKey, privKey } = curve.generateKeyPair();
        return {
            private: Buffer.from(privKey),
            // remove version byte
            public: Buffer.from(pubKey.slice(1))
        };
    },
    sharedKey: (privateKey, publicKey) => {
        const priv = toBuffer(privateKey, 'private key');
        const pub = toBuffer(publicKey, 'public key');
        const shared = curve.calculateAgreement(generateSignalPubKey(pub), priv);
        return Buffer.from(shared);
    },
    sign: (privateKey, buf) => {
        const priv = toBuffer(privateKey);
        const _buf = toBuffer(buf);
        return curve.calculateSignature(priv, _buf);
    },
    verify: (pubKey, message, signature) => {
        try {
            const pub = toBuffer(pubKey);
            const _message = toBuffer(message);
            const _signature = toBuffer(signature);
            curve.verifySignature(generateSignalPubKey(pub), _message, _signature);
            return true;
        }
        catch (error) {
            return false;
        }
    }
};
export const signedKeyPair = (identityKeyPair, keyId) => {
    const preKey = Curve.generateKeyPair();
    const pubKey = generateSignalPubKey(preKey.public);
    const priv = toBuffer(identityKeyPair.private);
    const pub = toBuffer(generateSignalPubKey(pubKey));
    const signature = Curve.sign(priv, pub);
    return { keyPair: preKey, signature, keyId };
};
const GCM_TAG_LENGTH = 128 >> 3;
/**
 * encrypt AES 256 GCM;
 * where the tag tag is suffixed to the ciphertext
 * */
export function aesEncryptGCM(plaintext, key, iv, additionalData) {
    const cipher = gcm(toBytes(key, 'key'), toBytes(iv, 'iv'), toBytes(additionalData, 'additionalData'));
    return toBuffer(cipher.encrypt(toBytes(plaintext, 'plaintext')));
}
/**
 * decrypt AES 256 GCM;
 * where the auth tag is suffixed to the ciphertext
 * */
export function aesDecryptGCM(ciphertext, key, iv, additionalData) {
    const ciphertextBytes = toBytes(ciphertext, 'ciphertext');
    if (ciphertextBytes.length < GCM_TAG_LENGTH) {
        throw new Error('Invalid GCM ciphertext');
    }
    const cipher = gcm(toBytes(key, 'key'), toBytes(iv, 'iv'), toBytes(additionalData, 'additionalData'));
    return toBuffer(cipher.decrypt(ciphertextBytes));
}
export function aesEncryptCTR(plaintext, key, iv) {
    return toBuffer(ctr(toBytes(key, 'key'), toBytes(iv, 'iv')).encrypt(toBytes(plaintext, 'plaintext')));
}
export function aesDecryptCTR(ciphertext, key, iv) {
    return toBuffer(ctr(toBytes(key, 'key'), toBytes(iv, 'iv')).decrypt(toBytes(ciphertext, 'ciphertext')));
}
/** decrypt AES 256 CBC; where the IV is prefixed to the buffer */
export function aesDecrypt(buffer, key) {
    const buf = toBytes(buffer, 'buffer');
    return aesDecryptWithIV(buf.subarray(16), key, buf.subarray(0, 16));
}
/** decrypt AES 256 CBC */
export function aesDecryptWithIV(buffer, key, IV) {
    return toBuffer(cbc(toBytes(key, 'key'), toBytes(IV, 'IV')).decrypt(toBytes(buffer, 'buffer')));
}
// encrypt AES 256 CBC; where a random IV is prefixed to the buffer
export function aesEncrypt(buffer, key) {
    const _buffer = toBytes(buffer, 'buffer');
    const IV = randomBytes(16);
    const aes = cbc(toBytes(key, 'key'), IV);
    return toBuffer(new Uint8Array([...IV, ...aes.encrypt(_buffer)])); // prefix IV to the buffer
}
// encrypt AES 256 CBC with a given IV
export function aesEncrypWithIV(buffer, key, IV) {
    return toBuffer(cbc(toBytes(key, 'key'), toBytes(IV, 'IV')).encrypt(toBytes(buffer, 'buffer')));
}
// sign HMAC using SHA 256
export function hmacSign(buffer, key, variant = 'sha256') {
    const hash = variant === 'sha256' ? hashSha256 : hashSha512;
    return toBuffer(hmac(hash, toBytes(key, 'key'), toBytes(buffer, 'buffer')));
}
export function sha256(buffer) {
    return toBuffer(hashSha256(toBytes(buffer)));
}
export async function derivePairingCodeKey(pairingCode, salt) {
    // Convert inputs to formats Web Crypto API can work with
    const encoder = new TextEncoder();
    const pairingCodeBuffer = encoder.encode(pairingCode);
    const saltBuffer = toBytes(salt);
    // Import the pairing code as key material
    const keyMaterial = await subtle.importKey('raw', pairingCodeBuffer, { name: 'PBKDF2' }, false, [
        'deriveBits'
    ]);
    // Derive bits using PBKDF2 with the same parameters
    // 2 << 16 = 131,072 iterations
    const derivedBits = await subtle.deriveBits({
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 2 << 16,
        hash: 'SHA-256'
    }, keyMaterial, 32 * 8 // 32 bytes * 8 = 256 bits
    );
    return toBuffer(derivedBits);
}
