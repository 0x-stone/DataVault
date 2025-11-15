export interface Company {
  companyId: string;
  companyName: string;
  email: string;
  password: string
  status: 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}


export interface CompanyData {
  webhookUrl?: string
  redirectUris?: string[]
  logo?: string | null
  companyName?: string 
  email?:string
}

export interface APIKey {
  keyId: string
  name: string
  clientId: string
  secretKey: string
  companyId: string
  createdAt: Date
  updatedAt:Date
}