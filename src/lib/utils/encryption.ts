import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Utility class for encrypting and decrypting sensitive data
 */
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  /**
   * Creates a new EncryptionService instance
   * @param encryptionKey The encryption key to use (should be stored in environment variables)
   */
  constructor(private readonly encryptionKey: string) {
    this.key = Buffer.alloc(32);
    Buffer.from(encryptionKey, 'utf-8').copy(this.key);
  }

  /**
   * Encrypts a string value
   * @param text The text to encrypt
   * @returns The encrypted text as a string in format: iv:authTag:encryptedData
   */
  encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  /**
   * Decrypts an encrypted string
   * @param encryptedText The encrypted text as a base64 string
   * @returns The decrypted text
   */
  decrypt(encryptedText: string): string {
    try {
      const buffer = Buffer.from(encryptedText, 'base64');
      const iv = buffer.subarray(0, 16);
      const authTag = buffer.subarray(16, 32);
      const encrypted = buffer.subarray(32);

      const decipher = createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]).toString('utf8');
    } catch (error) {
      throw new Error('Failed to decrypt data');
    }
  }
} 