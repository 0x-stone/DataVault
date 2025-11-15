import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CompanyProvider, useCompany } from './context/CompanyContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import PersonalData from './pages/PersonalData';
import AccessLogs from './pages/AccessLogs';
import ActiveAccess from './pages/ActiveAccess';
import Authorize from './pages/Authorize';
import Layout from './components/Layout';
import CompanyLogin from './pages/company/CompanyLogin';
import CompanyRegister from './pages/company/CompanyRegister';
import CompanyDashboard from './pages/company/CompanyDashboard';
import CompanyLayout from './components/CompanyLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function CompanyProtectedRoute({ children }: { children: React.ReactNode }) {
  const { company, loading } = useCompany();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!company) {
    return <Navigate to="/company/login" replace />;
  }

  return <>{children}</>;
}

function CompanyPublicRoute({ children }: { children: React.ReactNode }) {
  const { company, loading } = useCompany();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (company) {
    return <Navigate to="/company/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* User Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route
        path="/authorize"
        element={
          <ProtectedRoute>
            <Authorize />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <Layout>
              <Documents />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/personal-data"
        element={
          <ProtectedRoute>
            <Layout>
              <PersonalData />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/access-logs"
        element={
          <ProtectedRoute>
            <Layout>
              <AccessLogs />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/active-access"
        element={
          <ProtectedRoute>
            <Layout>
              <ActiveAccess />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Company Routes */}
      <Route path="/company/login" element={<CompanyPublicRoute><CompanyLogin /></CompanyPublicRoute>} />
      <Route path="/company/register" element={<CompanyPublicRoute><CompanyRegister /></CompanyPublicRoute>} />
      <Route
        path="/company/dashboard"
        element={
          <CompanyProtectedRoute>
            <CompanyLayout>
              <CompanyDashboard />
            </CompanyLayout>
          </CompanyProtectedRoute>
        }
      />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </BrowserRouter>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;

