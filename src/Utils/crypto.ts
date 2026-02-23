import * as curve from 'libsignal/src/curve'
import { KEY_BUNDLE_TYPE } from '../Defaults'
import type { KeyPair } from '../Types'
import { toBuffer, toBytes } from './bytes'
import { hmac } from '@noble/hashes/hmac.js'
import { cbc, ctr, gcm } from '@noble/ciphers/aes.js'
import { hkdf as _hkdf } from '@noble/hashes/hkdf.js'
import { sha256 as hashSha256, sha512 as hashSha512 } from '@noble/hashes/sha2.js'
import { randomBytes } from '@noble/ciphers/utils.js'

// insure browser & node compatibility
const { subtle } = globalThis.crypto

export const hkdf = (buffer: Buffer | Uint8Array, expanded_length: number, opt: {
	salt?: Uint8Array | undefined;
	info?: string | undefined;
}): Uint8Array => {
	const _buffer = toBytes(buffer, 'buffer')
	const salt = opt.salt
	const info = opt.info ? toBytes(opt.info) : undefined
	return _hkdf(hashSha256, _buffer, salt, info, expanded_length)
}

/** prefix version byte to the pub keys, required for some curve crypto functions */
export const generateSignalPubKey = (pubKey: Uint8Array | Buffer) =>
	pubKey.length === 33 ? pubKey : Buffer.concat([KEY_BUNDLE_TYPE, pubKey])

export const Curve = {
	generateKeyPair: (): KeyPair => {
		const { pubKey, privKey } = curve.generateKeyPair()
		return {
			private: Buffer.from(privKey),
			// remove version byte
			public: Buffer.from(pubKey.slice(1))
		}
	},
	sharedKey: (privateKey: Uint8Array, publicKey: Uint8Array) => {
		const priv = toBuffer(privateKey, 'private key')
		const pub = toBuffer(publicKey, 'public key')

		const shared = curve.calculateAgreement(generateSignalPubKey(pub), priv)
		return Buffer.from(shared)
	},
	sign: (privateKey: Uint8Array, buf: Uint8Array) => {
		const priv = toBuffer(privateKey)
		const _buf = toBuffer(buf)
		return curve.calculateSignature(priv, _buf)
	},
	verify: (pubKey: Uint8Array, message: Uint8Array, signature: Uint8Array) => {
		try {
			const pub = toBuffer(pubKey)
			const _message = toBuffer(message)
			const _signature = toBuffer(signature)

			curve.verifySignature(generateSignalPubKey(pub), _message, _signature)
			return true
		} catch (error) {
			return false
		}
	}
}

export const signedKeyPair = (identityKeyPair: KeyPair, keyId: number) => {
	const preKey = Curve.generateKeyPair()
	const pubKey = generateSignalPubKey(preKey.public)

	const priv = toBuffer(identityKeyPair.private)
	const pub = toBuffer(generateSignalPubKey(pubKey))
	const signature = Curve.sign(priv, pub)

	return { keyPair: preKey, signature, keyId }
}

const GCM_TAG_LENGTH = 128 >> 3

/**
 * encrypt AES 256 GCM;
 * where the tag tag is suffixed to the ciphertext
 * */
export function aesEncryptGCM(plaintext: Uint8Array, key: Uint8Array, iv: Uint8Array, additionalData: Uint8Array) {
	const cipher = gcm(toBytes(key, 'key'), toBytes(iv, 'iv'), toBytes(additionalData, 'additionalData'))
	return toBuffer(cipher.encrypt(toBytes(plaintext, 'plaintext')))
}

/**
 * decrypt AES 256 GCM;
 * where the auth tag is suffixed to the ciphertext
 * */
export function aesDecryptGCM(ciphertext: Uint8Array, key: Uint8Array, iv: Uint8Array, additionalData: Uint8Array) {
	const ciphertextBytes = toBytes(ciphertext, 'ciphertext')
	if (ciphertextBytes.length < GCM_TAG_LENGTH) {
		throw new Error('Invalid GCM ciphertext')
	}

	const cipher = gcm(toBytes(key, 'key'), toBytes(iv, 'iv'), toBytes(additionalData, 'additionalData'))
	return toBuffer(cipher.decrypt(ciphertextBytes))
}

export function aesEncryptCTR(plaintext: Uint8Array, key: Uint8Array, iv: Uint8Array) {
	return toBuffer(ctr(toBytes(key, 'key'), toBytes(iv, 'iv')).encrypt(toBytes(plaintext, 'plaintext')))
}

export function aesDecryptCTR(ciphertext: Uint8Array, key: Uint8Array, iv: Uint8Array) {
	return toBuffer(ctr(toBytes(key, 'key'), toBytes(iv, 'iv')).decrypt(toBytes(ciphertext, 'ciphertext')))
}

/** decrypt AES 256 CBC; where the IV is prefixed to the buffer */
export function aesDecrypt(buffer: Uint8Array, key: Uint8Array) {
	const buf = toBytes(buffer, 'buffer')
	return aesDecryptWithIV(buf.subarray(16), key, buf.subarray(0, 16))
}

/** decrypt AES 256 CBC */
export function aesDecryptWithIV(buffer: Uint8Array, key: Uint8Array, IV: Uint8Array) {
	return toBuffer(cbc(toBytes(key, 'key'), toBytes(IV, 'IV')).decrypt(toBytes(buffer, 'buffer')))
}

// encrypt AES 256 CBC; where a random IV is prefixed to the buffer
export function aesEncrypt(buffer: Uint8Array, key: Uint8Array) {
	const _buffer = toBytes(buffer, 'buffer')
	const IV = randomBytes(16)
	const aes = cbc(toBytes(key, 'key'), IV)
	return toBuffer(new Uint8Array([...IV, ...aes.encrypt(_buffer)])) // prefix IV to the buffer
}

// encrypt AES 256 CBC with a given IV
export function aesEncrypWithIV(buffer: Buffer, key: Buffer, IV: Buffer) {
	return toBuffer(cbc(toBytes(key, 'key'), toBytes(IV, 'IV')).encrypt(toBytes(buffer, 'buffer')))
}

// sign HMAC using SHA 256
export function hmacSign(
	buffer: Buffer | Uint8Array,
	key: Buffer | Uint8Array,
	variant: 'sha256' | 'sha512' = 'sha256'
) {
	const hash = variant === 'sha256' ? hashSha256 : hashSha512
	return toBuffer(hmac(hash, toBytes(key, 'key'), toBytes(buffer, 'buffer')))
}


export function sha256(buffer: Buffer) {
	return toBuffer(hashSha256(toBytes(buffer)))
}

export async function derivePairingCodeKey(pairingCode: string, salt: Buffer | Uint8Array): Promise<Buffer> {
	// Convert inputs to formats Web Crypto API can work with
	const encoder = new TextEncoder()
	const pairingCodeBuffer = encoder.encode(pairingCode)
	const saltBuffer = toBytes(salt)

	// Import the pairing code as key material
	const keyMaterial = await subtle.importKey('raw', pairingCodeBuffer, { name: 'PBKDF2' }, false, [
		'deriveBits'
	])

	// Derive bits using PBKDF2 with the same parameters
	// 2 << 16 = 131,072 iterations
	const derivedBits = await subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: saltBuffer as BufferSource,
			iterations: 2 << 16,
			hash: 'SHA-256'
		},
		keyMaterial,
		32 * 8 // 32 bytes * 8 = 256 bits
	)

	return toBuffer(derivedBits)
}