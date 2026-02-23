import { randomInt, randomBytes } from 'crypto'
import { generateKeyPair } from 'libsignal/src/curve'
import { Buffer } from 'buffer'

type KeyPairType = ReturnType<typeof generateKeyPair>

export function generateSenderKey(): Buffer {
	return randomBytes(32)
}

export function generateSenderKeyId(): number {
	return randomInt(2147483647)
}

export interface SigningKeyPair {
	public: Buffer
	private: Buffer
}

export function generateSenderSigningKey(key?: KeyPairType): SigningKeyPair {
	if (!key) {
		key = generateKeyPair()
	}

	return {
		public: Buffer.from(key.pubKey),
		private: Buffer.from(key.privKey)
	}
}
