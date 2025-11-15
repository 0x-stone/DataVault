import { useState, useEffect, useRef } from 'react';
import { useCompany } from '../../context/CompanyContext';
import { companyService, APIKey } from '../../services/company.service';
import { useForm } from 'react-hook-form';
import {
  Building2,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Settings,
  Globe,
  Webhook,
  Upload,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface CompanyDataForm {
  companyName: string;
  email: string;
  redirectUris: string;
  webhookUrl: string;
}

interface APIKeyForm {
  name: string;
}

export default function CompanyDashboard() {
  const { company, refreshCompany } = useCompany();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [keysLoading, setKeysLoading] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState<string | null>(null);
  const [newKeyData, setNewKeyData] = useState<{ clientId: string; secretKey: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'keys' | 'settings'>('keys');
  const logoFileRef = useRef<HTMLInputElement>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);

  const {
    register: registerSettings,
    handleSubmit: handleSubmitSettings,
    formState: { errors: settingsErrors },
    reset: resetSettings,
  } = useForm<CompanyDataForm>();

  const {
    register: registerKey,
    handleSubmit: handleSubmitKey,
    formState: { errors: keyErrors },
    reset: resetKey,
  } = useForm<APIKeyForm>();

  useEffect(() => {
    if (company) {
      // Convert redirectUris array to comma-separated string for display
      // The service layer ensures redirectUris is always an array
      const redirectUrisString = Array.isArray(company.redirectUris) && company.redirectUris.length > 0
        ? company.redirectUris.join(', ')
        : '';
      
      resetSettings({
        companyName: company.companyName,
        email: company.email,
        redirectUris: redirectUrisString,
        webhookUrl: company.webhookUrl || '',
      });
    }
  }, [company, resetSettings]);

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    setKeysLoading(true);
    try {
      const keys = await companyService.listAPIKeys();
      setApiKeys(keys);
    } catch (error) {
      // Error handled by service
    } finally {
      setKeysLoading(false);
    }
  };

  const onUpdateSettings = async (data: CompanyDataForm) => {
    setLoading(true);
    try {
      // Parse redirect URIs from comma-separated string to array
      // Only send if there are valid URIs
      let redirectUrisArray: string[] | undefined = undefined;
      if (data.redirectUris && data.redirectUris.trim()) {
        redirectUrisArray = data.redirectUris
          .split(',')
          .map((uri) => uri.trim())
          .filter((uri) => uri.length > 0);
        // If array is empty after filtering, set to undefined
        if (redirectUrisArray.length === 0) {
          redirectUrisArray = undefined;
        }
      }

      const updatedCompany = await companyService.updateCompanyData({
        companyName: data.companyName,
        email: data.email,
        redirectUris: redirectUrisArray,
        webhookUrl: data.webhookUrl || undefined,
        logo: selectedLogo || undefined,
      });
      // Company data is already updated in the service, just refresh the context
      await refreshCompany();
    } catch (error) {
      // Error handled by service
    } finally {
      setLoading(false);
    }
  };

  const onCreateKey = async (data: APIKeyForm) => {
    setLoading(true);
    try {
      const response = await companyService.createAPIKey(data.name);
      setNewKeyData({
        clientId: response.data.clientId,
        secretKey: response.data.secretKey,
      });
      setShowSecretKey(response.data.secretKey);
      await loadAPIKeys();
      resetKey();
      toast.success('API key created! Save your secret key securely.');
    } catch (error) {
      // Error handled by service
    } finally {
      setLoading(false);
    }
  };

  const onDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }
    setLoading(true);
    try {
      await companyService.deleteAPIKey(keyId);
      await loadAPIKeys();
    } catch (error) {
      // Error handled by service
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Company Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your company settings and API keys
          </p>
        </div>
        {company?.logo && (
          <div className="h-16 w-16 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700">
            <img src={company.logo} alt={company.companyName} className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      {/* Company Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {company?.companyName}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">{company?.email}</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
              Company ID: {company?.companyId}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('keys')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'keys'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          API Keys
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Settings
        </button>
      </div>

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          {/* New Key Modal/Form */}
          {newKeyData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-xl p-6 border-2 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  ⚠️ Save Your Secret Key
                </h3>
                <button
                  onClick={() => {
                    setNewKeyData(null);
                    setShowSecretKey(null);
                  }}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                This is the only time you'll see your secret key. Save it securely!
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Client ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKeyData.clientId}
                      readOnly
                      className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(newKeyData.clientId, 'clientId')}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      {copiedKey === 'clientId' ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Secret Key
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type={showSecretKey ? 'text' : 'password'}
                        value={newKeyData.secretKey}
                        readOnly
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm"
                      />
                      <button
                        onClick={() => setShowSecretKey(showSecretKey ? null : newKeyData.secretKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
                      >
                        {showSecretKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => copyToClipboard(newKeyData.secretKey, 'secretKey')}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      {copiedKey === 'secretKey' ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Create New Key Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Create New API Key
            </h2>
            <form onSubmit={handleSubmitKey(onCreateKey)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Key Name
                </label>
                <input
                  {...registerKey('name', {
                    required: 'Key name is required',
                    minLength: {
                      value: 3,
                      message: 'Name must be at least 3 characters',
                    },
                    maxLength: {
                      value: 25,
                      message: 'Name must be at most 25 characters',
                    },
                  })}
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Production Key"
                />
                {keyErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{keyErrors.name.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create API Key
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* API Keys List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Your API Keys ({apiKeys.length}/5)
            </h2>
            {keysLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Key className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No API keys yet. Create your first one above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.keyId}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Key className="h-4 w-4 text-slate-500" />
                        <h3 className="font-medium text-slate-900 dark:text-slate-100">
                          {key.name}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                        {key.clientId}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Created: {new Date(key.createdAt).toLocaleDateString()}
                        {key.lastUsed && ` • Last used: ${new Date(key.lastUsed).toLocaleDateString()}`}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteKey(key.keyId)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete key"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Company Settings
          </h2>
          <form onSubmit={handleSubmitSettings(onUpdateSettings)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Company Name
              </label>
              <input
                {...registerSettings('companyName', {
                  required: 'Company name is required',
                  minLength: {
                    value: 4,
                    message: 'Company name must be at least 4 characters',
                  },
                })}
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {settingsErrors.companyName && (
                <p className="mt-1 text-sm text-red-600">{settingsErrors.companyName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <input
                {...registerSettings('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {settingsErrors.email && (
                <p className="mt-1 text-sm text-red-600">{settingsErrors.email.message}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Globe className="h-4 w-4" />
                Redirect URIs
              </label>
              <input
                {...registerSettings('redirectUris')}
                type="text"
                placeholder="https://example.com/callback, https://app.example.com/auth"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                Enter valid URLs separated by commas (e.g., https://example.com/callback, https://app.example.com/auth)
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Webhook className="h-4 w-4" />
                Webhook URL
              </label>
              <input
                {...registerSettings('webhookUrl', {
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Must be a valid URL',
                  },
                })}
                type="url"
                placeholder="https://example.com/webhook"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {settingsErrors.webhookUrl && (
                <p className="mt-1 text-sm text-red-600">{settingsErrors.webhookUrl.message}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                <Upload className="h-4 w-4" />
                Company Logo
              </label>
              
              {/* Current Logo Display */}
              {company?.logo && (
                <div className="mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Current Logo:</p>
                  <div className="relative inline-block">
                    <img
                      src={company.logo}
                      alt="Company logo"
                      className="h-24 w-24 rounded-lg object-cover border-2 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              )}

              {/* Modern Image Upload */}
              <div className="relative">
                <input
                  ref={logoFileRef}
                  type="file"
                  accept="image/*"
                  id="logo-upload"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedLogo(file);
                  }}
                />
                <label
                  htmlFor="logo-upload"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-200 group"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                    <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </label>
              </div>
              
              {/* Preview of selected image */}
              {selectedLogo && (
                <div className="mt-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">New Logo Preview:</p>
                  <img
                    src={URL.createObjectURL(selectedLogo)}
                    alt="Preview"
                    className="h-24 w-24 rounded-lg object-cover border-2 border-blue-500"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Settings className="h-5 w-5" />
                  Update Settings
                </>
              )}
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
}

