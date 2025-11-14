import { database, companiesCollection, apiKeysCollection } from '../config/database'
import { Encryption } from '../services/encryption.service'
import { AuthService } from '../services/auth.service'
import { Company, APIKey, CompanyData } from '../types'
import { v4 as uuidv4 } from 'uuid'

export class CompanyModel {
  private collection = companiesCollection

  async registerCompany(data: {
    companyName: string
    companyId: string
    password: string
    email: string
  }): Promise<{ company: Company }> {
    const company: Company = {
      companyId: data.companyId,
      companyName: data.companyName,
      email: data.email,
      password: await AuthService.hashPassword(data.password),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await this.collection.insertOne(company)
    return { company }
  }

  async updateCompanyData(companyId: string, data: CompanyData): Promise<void> {
    const companyData: Partial<CompanyData> = {}

    if (data.redirectUris) companyData.redirectUris = data.redirectUris
    if (data.webhookUrl) companyData.webhookUrl = data.webhookUrl
    if (data.logo) companyData.logo = data.logo
    if (data.email) companyData.email = data.email
    if (data.companyName) companyData.companyName = data.companyName

    await this.collection.updateOne({ companyId }, { $set: companyData })
  }

  async getCompany(companyId:string): Promise<Company & CompanyData | null> {
    return await this.collection.findOne({ companyId }) as Company & CompanyData | null
  }

    async getCompanyByEmail(email: string): Promise<Company & CompanyData | null> {
      return await this.collection.findOne({ email }) as Company & CompanyData | null
    }

  async apiKeysCount(companyId: string): Promise<number> {
    return await apiKeysCollection.countDocuments({ companyId }) as number
  }

  async createAPIKey(companyId: string, name: string): Promise<Record<string, string>> {
    const secretKey = Encryption.generateSecretKey()
    const hashedSecret = await Encryption.hashSecretKey(secretKey)
    const clientId = Encryption.generateClientId()

    console.log(hashedSecret)
    await apiKeysCollection.insertOne({
      keyId: uuidv4(),
      name,
      companyId,
      clientId,
      secretKey: hashedSecret,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { clientId, secretKey }
  }

  async listAPIKeys(companyId: string): Promise<APIKey[]> {
    return await apiKeysCollection.find({ companyId }).toArray() as APIKey[]
  }

  async deleteAPIKey(companyId: string, keyId: string): Promise<boolean> {
    const result = await apiKeysCollection.deleteOne({ companyId, keyId })
    return result.deletedCount > 0
  }

async validateAPIKey(
  clientId: string,
  secretKey?: string | null
): Promise<string | null> {
  const apiKey = await apiKeysCollection.findOne({ clientId })

  if (!apiKey) return null
  if (!secretKey) return apiKey.companyId
  const isValid = await Encryption.verifySecretKey(secretKey, apiKey.secretKey)
  return isValid ? apiKey.companyId : null
}

}