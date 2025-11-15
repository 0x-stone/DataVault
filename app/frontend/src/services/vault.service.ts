import api from './api';
import toast from 'react-hot-toast';

export interface PersonalData {
  bvn?: string;
  nin?: string;
  dob?: string;
  address?: string;
}

export interface DocumentTypes {
  nin_front?: boolean;
  nin_back?: boolean;
  passport?: boolean;
  driver_license?: boolean;
  utility_bill?: boolean;
}

export interface VaultData {
  fullname: string;
  email: string;
  phone: string;
  documents: DocumentTypes;
  personalData: Partial<PersonalData>;
}

export interface AccessLog {
  action: string;
  companyId: string;
  companyName: string;
  description: string;
  dataAccessed: string[];
  timestamp: string;
}

export interface ActiveAccess {
  tokenId: string;
  companyName: string;
  requestedData: string[];
  grantedAt: string;
  expiresAt: string;
  daysLeft: number;
  accessCount: number;
  lastAccessedAt?: string;
  token: string;
}

export const vaultService = {
  async uploadDocument(file: File, documentType: string): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const response = await api.post('/api/vault/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success(`${documentType} uploaded successfully!`);
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Upload failed';
      toast.error(message);
      throw error;
    }
  },

  async savePersonalData(data: PersonalData): Promise<void> {
    try {
      const response = await api.post('/api/vault/data', data);
      if (response.data.success) {
        toast.success('Personal data saved successfully!');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to save data';
      toast.error(message);
      throw error;
    }
  },

  async getVaultData(): Promise<VaultData> {
    const response = await api.get<{ success: boolean; data: VaultData }>('/api/vault/data');
    return response.data.data;
  },

  async getAccessLogs(): Promise<AccessLog[]> {
    const response = await api.get<{ success: boolean; data: AccessLog[] }>('/api/vault/access-logs');
    return response.data.data;
  },

  async getActiveAccess(): Promise<ActiveAccess[]> {
    const response = await api.get<{ success: boolean; data: ActiveAccess[] }>('/api/vault/active-access');
    return response.data.data;
  },

  async revokeAccess(tokenId: string): Promise<void> {
    try {
      if (!tokenId) {
        throw new Error('Token ID is required');
      }
      const response = await api.post('/api/vault/revoke-access', { tokenId: tokenId });
      if (response.data.success) {
        toast.success('Access revoked successfully!');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to revoke access';
      toast.error(message);
      throw error;
    }
  },
};


