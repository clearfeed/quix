import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Get encryption key from environment variables
const encryptionKey = process.env.ENCRYPTION_KEY || 'default-fallback-key-for-development';
const key = Buffer.alloc(32);
Buffer.from(encryptionKey, 'utf-8').copy(key);
const algorithm = 'aes-256-gcm';

/**
 * Encrypts a string value
 * @param text The text to encrypt
 * @returns The encrypted text as a base64 string
 */
export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/**
 * Decrypts an encrypted string
 * @param encryptedText The encrypted text as a base64 string
 * @returns The decrypted text
 */
export function decrypt(encryptedText: string): string {
  try {
    const buffer = Buffer.from(encryptedText, 'base64');
    const iv = buffer.subarray(0, 16);
    const authTag = buffer.subarray(16, 32);
    const encrypted = buffer.subarray(32);

    const decipher = createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch (error) {
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypts a string value for logging purposes
 * @param text The text to encrypt
 * @returns The encrypted text as a base64 string
 * In development mode, the text is not encrypted
 */
export function encryptForLogs(text: string): string {
  return process.env.NODE_ENV === 'development' ? text : encrypt(text);
}
