import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const CIPHERTEXT_OFFSET = IV_LENGTH + AUTH_TAG_LENGTH

export function encrypt(plaintext: string, masterKey: Buffer): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, masterKey, iv)
  const part1 = cipher.update(plaintext, 'utf8')
  const part2 = cipher.final()
  const authTag = cipher.getAuthTag()
  // Format: iv (12) + authTag (16) + ciphertext (variable), base64 encoded
  return Buffer.concat([iv, authTag, part1, part2]).toString('base64')
}

export function decrypt(encoded: string, masterKey: Buffer): string {
  const data = Buffer.from(encoded, 'base64')
  const iv = data.subarray(0, IV_LENGTH)
  const authTag = data.subarray(IV_LENGTH, CIPHERTEXT_OFFSET)
  const ciphertext = data.subarray(CIPHERTEXT_OFFSET)
  const decipher = createDecipheriv(ALGORITHM, masterKey, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
