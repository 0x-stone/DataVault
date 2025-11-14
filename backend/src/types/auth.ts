


export interface SignupRequest {
  email: string;
  password: string;
  fullname: string;
  phone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  fullname: string;
  phone: string;
  passwordHash: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface CompanyJWTPayload {
  companyId: string;
}

export interface UserJWTPayload {
  userId: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {user:{
    userId: string;
    email: string;
    fullname: string;
    phone: string;
  }
  token: string};
  message?: string;
}
