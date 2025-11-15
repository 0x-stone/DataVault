import { MongoClient, Db, Collection } from "mongodb"
import {  AuthUser, Company, APIKey, CompanyData, AuthorizationRequest, VaultUserData, AccessToken, AccessLog } from '../types'
import dotenv from 'dotenv'

dotenv.config()

class Database {
    private client: MongoClient
    private db: Db | null = null

    constructor (){
        const uri= process.env.MONGODB_URL || ''
        this.client = new MongoClient(uri)
        console.log(uri)
    }

    async connect(): Promise<void>{
        try{
            await this.client.connect()
            this.db = this.client.db()
            console.log('Connected to MongoDB')
        } catch (err){
            console.error(`MongoDB connnection error ${err}`)
        }
    }

    getDB(): Db{
        if (this.db){
            return this.db
        }
        throw new Error ('Database not initialized yet')
    }

    async close(): Promise<void>{
        await this.client.close()
        console.log('closed MongoDB connection')
    }
}

export const database = new Database()


export let usersVaultCollection: Collection<VaultUserData>
export let tokensCollection: Collection<AccessToken>
export let logsCollection: Collection<AccessLog>
export let companiesCollection: Collection<Company&CompanyData>
export let authRequestsCollection: Collection<AuthorizationRequest>
export let usersCollection: Collection< AuthUser>
export let apiKeysCollection: Collection<APIKey>


export async function initCollections() {
  const db = database.getDB()
  usersVaultCollection = db.collection<VaultUserData>("vaults")
  tokensCollection = db.collection<AccessToken>("access_tokens")
  logsCollection = db.collection<AccessLog>("access_logs")
  companiesCollection = db.collection<Company&CompanyData>("companies")
  authRequestsCollection = db.collection<AuthorizationRequest>("authorization_requests")
  usersCollection = db.collection<AuthUser>("users")
  apiKeysCollection= db.collection<APIKey>("apiKeys")
}
