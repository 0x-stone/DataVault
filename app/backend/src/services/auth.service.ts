import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { usersCollection } from '../config/database'
import { AuthUser, UserJWTPayload, CompanyJWTPayload, SignupRequest } from '../types/auth'
import { v4 as uuidv4 } from 'uuid'

const USER_JWT_SECRET = process.env.USER_JWT_SECRET as string
const COMPANY_JWT_SECRET = process.env.COMPANY_JWT_SECRET as string
const COMPANY_JWT_EXPIRES_IN = process.env.COMPANY_JWT_EXPIRES_IN as string
const USER_JWT_EXPIRES_IN = process.env.USER_JWT_EXPIRES_IN as string
const SALT_ROUNDS = 10

export class AuthService {
  private userscollection = usersCollection

  
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS)
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  static generateUserToken(payload: UserJWTPayload): string {
  return jwt.sign(payload, USER_JWT_SECRET, {
    expiresIn: USER_JWT_EXPIRES_IN
  } as jwt.SignOptions)
}

  static verifyUserToken(token: string): UserJWTPayload | null {
    try {
      return jwt.verify(token, USER_JWT_SECRET) as UserJWTPayload
    } catch (error) {
      return null
    }
  }

    static generateCompanyToken(payload: CompanyJWTPayload): string {
  return jwt.sign(payload, COMPANY_JWT_SECRET, {
    expiresIn: COMPANY_JWT_EXPIRES_IN
  } as jwt.SignOptions)
}

  static verifyCompanyToken(token: string): CompanyJWTPayload | null {
    try {
      return jwt.verify(token, COMPANY_JWT_SECRET) as CompanyJWTPayload
    } catch (error) {
      return null
    }
  }


  async userExists(email: string): Promise<boolean> {
    const user = await this.userscollection.findOne({ email })
    return !!user
  }


  async createUser(signupData: SignupRequest): Promise<AuthUser> {
    const passwordHash = await AuthService.hashPassword(signupData.password)

    const user: AuthUser = {
      userId: uuidv4(),
      email: signupData.email,
      fullname: signupData.fullname,
      phone: signupData.phone,
      passwordHash,
      createdAt: new Date()
    }

    await this.userscollection.insertOne(user)

    return user
  }

  async getUserByEmail(email: string): Promise<AuthUser | null> {
    return await this.userscollection.findOne({ email }) as AuthUser | null
  }

    async getUserById(userId: string): Promise<AuthUser | null> {
    return await this.userscollection.findOne({ userId }) as AuthUser | null
  }

  async updateLastLogin(email: string): Promise<void> {
    await this.userscollection.updateOne(
      { email },
      { $set: { lastLogin: new Date() } }
    )
  }
}