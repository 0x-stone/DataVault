export interface VaultDocuments {
  nin_front?: string;    
  nin_back?: string;
  passport?: string;
  utility_bill?: string;
  driver_license?:string, 
}

export interface VaultPersonalData {
  bvn?: string;
  nin?: string;
  dob?: string;
  address?: string;
}

export interface VaultUserData {
  userId: string;
  documents: VaultDocuments;
  personalData: VaultPersonalData;
  createdAt: Date;
  updatedAt: Date;
}


export interface AuthorizationRequest {
  requestId: string;
  companyId: string;
  companyName: string
  userId: string;
  requestedData: string[];
  purpose: string;
  duration: number;    
  redirectUri: string;
  state?: string,
  status: 'pending' | 'approved' | 'denied';
  createdAt: Date;
  accessCode: string
  expiry: Date
}

export interface AccessToken {
  tokenId:string
  userId: string;
  token: string;
  companyId: string;
  companyName: string;
  requestedData: string[];
  grantedAt: Date;
  expiresAt: Date;
  status: 'active' | 'revoked' | 'expired';
  accessCount: number;
  lastAccessedAt?: Date;
}

export interface AccessLog {
  logId:string,
  companyId: string;
  companyName:string
  userId: string;
  action: 'read' | 'request_approved' | 'request_denied' | 'token_revoked';
  dataAccessed?: string[];
  timestamp: Date;
  userAgent?: string;
  description: string;   
}
