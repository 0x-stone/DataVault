import { randomBytes } from 'crypto'
import { database } from '../config/database'
import { AccessToken } from '../types'
import { v4 as uuidv4 } from 'uuid'

export class AccessTokenModel {
    private collection= database.getDB().collection('access_tokens')

    generateToken(): string {
    return randomBytes(32).toString('base64url')
  }

  async createToken(tokenData: Partial<AccessToken>): Promise<string> {
    const token = this.generateToken()

    const tokenDoc: AccessToken = {
      tokenId: uuidv4(), 
      token,
      userId: tokenData.userId!,
      companyId: tokenData.companyId!,
      companyName: tokenData.companyName!,
      requestedData: tokenData.requestedData!,
      grantedAt: new Date(),
      expiresAt: tokenData.expiresAt!,
      status: 'active',
      accessCount: 0
    }
    await this.collection.insertOne(tokenDoc)
    return token
    }
    async getToken(token: string): Promise<AccessToken | null> {
    return await this.collection.findOne({ 
      token,
      status: 'active',
      expiresAt: { $gt: new Date() }
    }) as AccessToken | null
  }
  async incrementAccessCount(token: string): Promise<void> {
    await this.collection.updateOne(
      { token },
      { 
        $inc: { accessCount: 1 },
        $set: { updatedAt: new Date() }
      }
    )
  }
  async revokeTokens(userId: string, companyId: string): Promise<number> {
    const result = await this.collection.updateMany(
      { userId, companyId, status: 'active' },
      { 
        $set: { 
          status: 'revoked',
          updatedAt: new Date()
        }
      }
    )

    return result.modifiedCount
  }

async getActiveTokens(userId: string): Promise<any[]> {
    return await this.collection.find({ userId, 
        status: 'active',
        expiresAt: { $gt: new Date() }
      })
      .toArray()  
}
}