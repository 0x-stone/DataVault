import companyApi from './company-api';
import toast from 'react-hot-toast';

export interface CompanyRegisterData {
  companyName: string;
  email: string;
  password: string;
}

export interface CompanyLoginData {
  email: string;
  password: string;
}

export interface Company {
  userId: string;
  companyId: string;
  email: string;
  companyName: string;
  logo?: string;
  redirectUris?: string[];
  webhookUrl?: string;
}

export interface CompanyAuthResponse {
  success: boolean;
  data: {
    company: Company;
    token: string;
  };
  message: string;
}

export interface APIKey {
  keyId: string;
  name: string;
  clientId: string;
  createdAt: string;
  lastUsed?: string;
}

export interface CreateAPIKeyResponse {
  success: boolean;
  message: string;
  data: {
    clientId: string;
    secretKey: string;
  };
}

export interface CompanyUpdateData {
  companyName?: string;
  email?: string;
  redirectUris?: string[];
  webhookUrl?: string;
  logo?: File;
}

// Helper function to get current company (defined before companyService to avoid circular reference)
async function getCurrentCompany(): Promise<Company> {
  try {
    const response = await companyApi.get<{ success: boolean; data: { company: Company } }>('/api/company/me');
    const company = response.data.data.company;
    
    // Ensure redirectUris is always an array, not a string representation
    // Handle case where it might be stored as JSON string in database
    if (company.redirectUris) {
      if (typeof company.redirectUris === 'string') {
        try {
          const parsed = JSON.parse(company.redirectUris);
          if (Array.isArray(parsed)) {
            company.redirectUris = parsed;
          } else {
            company.redirectUris = [];
          }
        } catch (e) {
          // If parsing fails, set to empty array
          company.redirectUris = [];
        }
      } else if (!Array.isArray(company.redirectUris)) {
        // If it's not an array and not a string, set to empty array
        company.redirectUris = [];
      }
    } else {
      company.redirectUris = [];
    }
    
    return company;
  } catch (error: any) {
    const message = error.response?.data?.error || 'Failed to fetch company data';
    toast.error(message);
    throw error;
  }
}

export const companyService = {
  async register(data: CompanyRegisterData): Promise<CompanyAuthResponse> {
    try {
      const response = await companyApi.post<{ success: boolean; companyId: string; message: string }>(
        '/api/company/register',
        data
      );
      if (response.data.success) {
        toast.success('Company registered successfully!');
      }
      // Note: Register doesn't return token, user needs to login
      return {
        success: response.data.success,
        data: {         token: '', company: { userId: response.data.companyId, companyId: response.data.companyId, email: data.email, companyName: data.companyName } },
        message: response.data.message,
      };
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      throw error;
    }
  },

  async login(data: CompanyLoginData): Promise<CompanyAuthResponse> {
    try {
      const response = await companyApi.post<CompanyAuthResponse>('/api/company/login', data);
      if (response.data.success) {
        localStorage.setItem('company_token', response.data.data.token);
        // Fetch full company data from /me endpoint after login
        try {
          const fullCompany = await getCurrentCompany();
          localStorage.setItem('company', JSON.stringify(fullCompany));
          // Update response with full company data
          response.data.data.company = fullCompany;
        } catch (error) {
          // If /me fails, use the basic company data from login response
          localStorage.setItem('company', JSON.stringify(response.data.data.company));
        }
        toast.success('Welcome back!');
      }
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      throw error;
    }
  },

  async updateCompanyData(data: CompanyUpdateData): Promise<Company> {
    try {
      const formData = new FormData();
      if (data.companyName) formData.append('companyName', data.companyName);
      if (data.email) formData.append('email', data.email);
      // Only send redirectUris if it's a non-empty array
      // Backend expects a JSON string that it will parse
      if (data.redirectUris && data.redirectUris.length > 0) {
        formData.append('redirectUris', JSON.stringify(data.redirectUris));
      }
      if (data.webhookUrl) formData.append('webhookUrl', data.webhookUrl);
      if (data.logo) {
        // Append the File object to FormData with the key 'file' (backend expects 'file')
        formData.append('file', data.logo);
        console.log('File appended to FormData:', data.logo.name, data.logo.size, data.logo.type);
      }

      // Log FormData contents for debugging
      console.log('FormData entries:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      // The interceptor will handle Content-Type and Authorization headers
      const response = await companyApi.put<{ success: boolean; message: string }>(
        '/api/company/data',
        formData
      );
      if (response.data.success) {
        toast.success(response.data.message || 'Company data updated successfully!');
        // Fetch updated company data from /me endpoint
        const updatedCompany = await getCurrentCompany();
        localStorage.setItem('company', JSON.stringify(updatedCompany));
        return updatedCompany;
      }
      throw new Error('Update failed');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Update failed';
      toast.error(message);
      throw error;
    }
  },

  async createAPIKey(name: string): Promise<CreateAPIKeyResponse> {
    try {
      const response = await companyApi.post<CreateAPIKeyResponse>('/api/company/keys', { name });
      if (response.data.success) {
        toast.success('API key created successfully!');
      }
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to create API key';
      toast.error(message);
      throw error;
    }
  },

  async listAPIKeys(): Promise<APIKey[]> {
    try {
      const response = await companyApi.get<{ success: boolean; data: APIKey[] }>('/api/company/keys');
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch API keys';
      toast.error(message);
      throw error;
    }
  },

  async deleteAPIKey(keyId: string): Promise<void> {
    try {
      const response = await companyApi.delete<{ success: boolean; message: string }>(
        `/api/company/keys/${keyId}`
      );
      if (response.data.success) {
        toast.success(response.data.message || 'API key deleted successfully');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to delete API key';
      toast.error(message);
      throw error;
    }
  },

  async getCurrentCompany(): Promise<Company> {
    return getCurrentCompany();
  },

  logout() {
    localStorage.removeItem('company_token');
    localStorage.removeItem('company');
    toast.success('Logged out successfully');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('company_token');
  },

  getStoredCompany(): Company | null {
    const companyStr = localStorage.getItem('company');
    return companyStr ? JSON.parse(companyStr) : null;
  },
};

