const crypto = require('crypto');

/**
 * Encryption Service
 * Handles encryption and decryption of sensitive data
 */
class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits

    // Get encryption key from environment
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex || keyHex.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }

    this.key = Buffer.from(keyHex, 'hex');
  }

  /**
   * Encrypt text
   * @param {string} text - Plain text to encrypt
   * @returns {Object} - {encrypted, iv, authTag}
   */
  encrypt(text) {
    if (!text) {
      throw new Error('Text to encrypt cannot be empty');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypt text
   * @param {string} encrypted - Encrypted text
   * @param {string} iv - Initialization vector
   * @param {string} authTag - Authentication tag
   * @returns {string} - Decrypted text
   */
  decrypt(encrypted, iv, authTag) {
    if (!encrypted || !iv || !authTag) {
      throw new Error('Missing required decryption parameters');
    }

    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        Buffer.from(iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed: Invalid encrypted data or authentication tag');
    }
  }

  /**
   * Generate a random encryption key
   * @returns {string} - 64-character hex string
   */
  static generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash a password using bcrypt-compatible approach
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password
   */
  async hashPassword(password) {
    const bcrypt = require('bcryptjs');
    return bcrypt.hash(password, 12);
  }

  /**
   * Compare password with hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>}
   */
  async comparePassword(password, hash) {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(password, hash);
  }
}

// Singleton instance
let encryptionService;

const getEncryptionService = () => {
  if (!encryptionService) {
    encryptionService = new EncryptionService();
  }
  return encryptionService;
};

module.exports = {
  EncryptionService,
  getEncryptionService,
  generateKey: EncryptionService.generateKey
};
