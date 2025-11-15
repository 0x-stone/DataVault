import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle2, X, Clock, FileText, User, Mail, Phone, Building2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Company {
  name: string;
  logo: string;
}

interface AuthorizeData {
  company: Company;
  requestedData: string | string[];
  purpose: string;
  duration: number;
}

const dataFieldLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  fullname: { label: 'Full Name', icon: User },
  email: { label: 'Email Address', icon: Mail },
  phone: { label: 'Phone Number', icon: Phone },
  bvn: { label: 'Bank Verification Number', icon: Shield },
  nin: { label: 'National Identification Number', icon: Shield },
  dob: { label: 'Date of Birth', icon: Clock },
  address: { label: 'Address', icon: Building2 },
  nin_front: { label: 'NIN Front', icon: FileText },
  nin_back: { label: 'NIN Back', icon: FileText },
  passport: { label: 'Passport', icon: FileText },
  driver_license: { label: 'Driver License', icon: FileText },
  utility_bill: { label: 'Utility Bill', icon: FileText },
};

export default function Authorize() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [data, setData] = useState<AuthorizeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get query parameters
  const clientId = searchParams.get('client_id');
  const requestedDataParam = searchParams.get('requested_data');
  const purpose = searchParams.get('purpose');
  const duration = searchParams.get('duration');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');

  useEffect(() => {
    const fetchAuthorizeData = async () => {
      if (!clientId || !requestedDataParam || !purpose || !duration || !redirectUri || !state) {
        setError('Missing required authorization parameters');
        setLoading(false);
        return;
      }

      try {
        const response = await api.get<{data:AuthorizeData}>('/authorize/authorize', {
          params: {
            client_id: clientId,
            requested_data: requestedDataParam,
            purpose,
            duration,
            redirect_uri: redirectUri,
            state,
          },
        });
        setData(response.data.data);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to load authorization request';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorizeData();
  }, [clientId, requestedDataParam, purpose, duration, redirectUri, state]);

  const handleApprove = async () => {
    if (!clientId || !requestedDataParam || !purpose || !duration || !redirectUri || !state) {
      return;
    }

    setProcessing(true);
    try {
      const response = await api.post<{ success: boolean; data:{redirectUrl: string} }>('/authorize/authorize/consent', {
        client_id: clientId,
        requested_data: requestedDataParam,
        purpose,
        duration,
        redirect_uri: redirectUri,
        state,
      });

      if (response.data.success && response.data.data.redirectUrl) {
        toast.success('Access granted successfully!');
        window.location.href = response.data.data.redirectUrl;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to grant access';
      toast.error(errorMessage);
      setProcessing(false);
    }
  };

  const handleDeny = () => {
    if (!redirectUri || !state) {
      toast.error('Invalid redirect parameters');
      return;
    }

    const denyUrl = new URL(redirectUri);
    denyUrl.searchParams.set('error', 'access_denied');
    denyUrl.searchParams.set('state', state);
    window.location.href = denyUrl.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading authorization request...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass rounded-2xl shadow-2xl p-8 text-center"
        >
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Authorization Error</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error || 'Invalid authorization request'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

const requestedDataArray = Array.isArray(data.requestedData)
  ? data.requestedData
  : typeof data.requestedData === "string"
  ? (data.requestedData as string).split(",")
  : [];

  const durationText = data.duration === 1 
    ? '1 day' 
    : data.duration < 30 
    ? `${data.duration} days` 
    : data.duration < 365 
    ? `${Math.floor(data.duration / 30)} month${Math.floor(data.duration / 30) > 1 ? 's' : ''}` 
    : `${Math.floor(data.duration / 365)} year${Math.floor(data.duration / 365) > 1 ? 's' : ''}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="glass rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Authorization Request</h1>
          
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">
            {/* Company Info */}
            <div className="text-center">
              <div className="inline-block mb-4">
                {data.company.logo ? (
                  <img
                    src={data.company.logo}
                    alt={`${data.company.name} logo`}
                    className="h-20 w-20 rounded-xl object-contain bg-white p-2 shadow-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="h-20 w-20 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg"
                  style={{ display: data.company.logo ? 'none' : 'flex' }}
                >
                  <Building2 className="h-10 w-10 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {data.company.name}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                wants to access your data
              </p>
            </div>

            {/* Requested Data */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Requested Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {requestedDataArray.map((field, index) => {
                  const fieldInfo = dataFieldLabels[field] || { label: field, icon: FileText };
                  const Icon = fieldInfo.icon;
                  return (
                    <motion.div
                      key={field}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"
                    >
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {fieldInfo.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Purpose */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Purpose
              </h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {data.purpose}
              </p>
            </div>

            {/* Duration */}
            <div className="flex items-center justify-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Access will be granted for
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {durationText}
              </span>
            </div>

            {/* Security Notice */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-1">
                    Your data is secure
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400">
                    You can revoke this access at any time from your dashboard. All data access is encrypted and logged.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleDeny}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Deny access request"
              >
                <X className="h-5 w-5" />
                Deny
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Approve access request"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Approve
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

