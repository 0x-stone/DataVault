import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const ENCRYPTION_KEY= process.env.ENCRYPTION_KEY || ''
const ALGORITHM = 'aes-256-gcm'

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  throw new Error('ENCRYPTION_KEY must be at least 32 characters.')
}

export class Encryption {

  static encrypt(text: string): string {
    try{
      const iv= crypto.randomBytes(12)

      const key = this.getMasterKey()

      const cipher= crypto.createCipheriv(ALGORITHM, key, iv)

      const encrypted= Buffer.concat([
        cipher.update(text), cipher.final()
      ])

      const authTag= cipher.getAuthTag()

      const combined= Buffer.concat([
        iv, authTag, encrypted
      ])

      return `v1:${combined.toString('base64')}`
    } catch(error){
      throw new Error(`String encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    }

    static decrypt(encryptedText: string): string {
      try{
        if (!encryptedText.startsWith('v1:')){
          throw new Error('Invalid encrypted string format (missing version)')
        }
        const base64Data= encryptedText.substring(3)
        const buffer= Buffer.from(base64Data, 'base64')

        const iv = buffer.subarray(0, 12)
        const authTag= buffer.subarray(12, 28)
        const encrypted = buffer.subarray(28)

        const key= this.getMasterKey()

        const decipher= crypto.createDecipheriv(ALGORITHM, key, iv)

        decipher.setAuthTag(authTag)

        try {
        const decrypted = decipher.update(encrypted, undefined, 'utf8') + 
                         decipher.final('utf8')
        return decrypted
        
        } catch (authError) {
        throw new Error('Decryption failed: Authentication failed (data may be tampered or wrong key)')
      }
      } catch(error){
        if (error instanceof Error && error.message.includes('Authentication failed')) {
        throw error
      }
      throw new Error(`String decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }


    static encryptBuffer(buffer: Buffer): Buffer {
    const salt = crypto.randomBytes(32)
    const iv = crypto.randomBytes(12)
    
    const key = crypto.scryptSync(this.getMasterKey(), salt, 32)
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    const encrypted = Buffer.concat([
      cipher.update(buffer),
      cipher.final()
    ])
    
    const authTag = cipher.getAuthTag()
    
    return Buffer.concat([
      salt,     
      iv,      
      authTag,  
      encrypted 
    ])
  }


  static decryptBuffer(encryptedBuffer: Buffer): Buffer {
    const salt = encryptedBuffer.subarray(0, 32)
    const iv = encryptedBuffer.subarray(32, 44)
    const authTag = encryptedBuffer.subarray(44, 60)
    const encrypted = encryptedBuffer.subarray(60)
    
    const key = crypto.scryptSync(this.getMasterKey(), salt, 32)
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    try {
      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ])
    } catch (error) {
      throw new Error('Decryption failed - data may be corrupted or tampered')
    }
  }

  static hash(text: string): string {
    return CryptoJS.SHA256(text).toString()
  }

  static generateSecretKey(): string {
    return `dv_sk_${crypto.randomBytes(32).toString('hex')}`
  }

  static generateClientId(): string {
    return `dv_ck_${crypto.randomBytes(12).toString('hex')}`
  }
  static generateToken(): string {
    return `dvt_${crypto.randomBytes(32).toString('base64url')}`
  }

  static async hashSecretKey(secretKey: string, rounds: number = 10): Promise<string> {
    if (!secretKey.startsWith('dv_sk_')) {
      throw new Error('Invalid secret key format')
    }
    
    try {
      const hash = await bcrypt.hash(secretKey, rounds)
      return hash
    } catch (error) {
      throw new Error(`Secret key hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  static async verifySecretKey(secretKey: string, hash: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(secretKey, hash)
      return isMatch
    } catch (error) {
      return false
    }
  }

  private static getMasterKey(): Buffer {
    return crypto.scryptSync(
      ENCRYPTION_KEY,
      'datavault-master-salt-v1',
      32
    )
  }

}


