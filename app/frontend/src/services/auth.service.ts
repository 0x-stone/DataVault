import api from './api';
import toast from 'react-hot-toast';

export interface SignupData {
  email: string;
  password: string;
  fullname: string;
  phone: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  userId: string;
  email: string;
  fullname: string;
  phone: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message: string;
}

export const authService = {
  async signup(data: SignupData): Promise<AuthResponse> {
    try {
      const response = await api.post<{success:boolean, data:AuthResponse}>('/api/auth/signup', data);
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        toast.success('Account created successfully!');
      }
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Signup failed';
      toast.error(message);
      throw error;
    }
  },

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post<{success:boolean, data:AuthResponse}>('/api/auth/login', data);
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        toast.success('Welcome back!');
      }
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      throw error;
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ success: boolean; data:{user: User} }>('/api/auth/me');
    return response.data.data.user;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};






