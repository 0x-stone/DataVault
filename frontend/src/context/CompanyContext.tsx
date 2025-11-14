import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company, companyService } from '../services/company.service';

interface CompanyContextType {
  company: Company | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { companyName: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (companyService.isAuthenticated()) {
        try {
          // Fetch fresh company data from /me endpoint
          const company = await companyService.getCurrentCompany();
          setCompany(company);
          // Update stored company data
          localStorage.setItem('company', JSON.stringify(company));
        } catch (error) {
          // If token is invalid, clear storage
          companyService.logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await companyService.login({ email, password });
    setCompany(response.data.company);
  };

  const register = async (data: { companyName: string; email: string; password: string }) => {
    await companyService.register(data);
    // After registration, user needs to login
  };

  const logout = () => {
    companyService.logout();
    setCompany(null);
  };

  const refreshCompany = async () => {
    if (companyService.isAuthenticated()) {
      try {
        const company = await companyService.getCurrentCompany();
        setCompany(company);
        localStorage.setItem('company', JSON.stringify(company));
      } catch (error) {
        // Error handled by service
      }
    }
  };

  return (
    <CompanyContext.Provider value={{ company, loading, login, register, logout, refreshCompany }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return context;
};

