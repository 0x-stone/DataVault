import { useState, useEffect } from 'react';
import { vaultService, ActiveAccess as ActiveAccessType } from '../services/vault.service';
import { Shield, Building2, Clock, X, Calendar, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ActiveAccess() {
  const [activeAccess, setActiveAccess] = useState<ActiveAccessType[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    loadActiveAccess();
  }, []);

  const loadActiveAccess = async () => {
    try {
      const data = await vaultService.getActiveAccess();
      setActiveAccess(data);
    } catch (error) {
      console.error('Failed to load active access:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (tokenId: string) => {
    if (!tokenId) {
      toast.error('Token ID is missing. Cannot revoke access.');
      return;
    }

    if (!confirm('Are you sure you want to revoke this access? This action cannot be undone.')) {
      return;
    }

    setRevoking(tokenId);
    try {
      await vaultService.revokeAccess(tokenId);
      await loadActiveAccess();
    } catch (error) {
      // Error handled by service
    } finally {
      setRevoking(null);
    }
  };

  const getDaysLeftColor = (daysLeft: number) => {
    if (daysLeft <= 7) return 'text-red-600 dark:text-red-400';
    if (daysLeft <= 30) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">Active Access</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage companies that currently have access to your data
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Active Tokens</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {activeAccess.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Expiring Soon</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {activeAccess.filter((a) => a.daysLeft <= 7).length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Accesses</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {activeAccess.reduce((sum, a) => sum + a.accessCount, 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Active Access List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6"
      >
        {activeAccess.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">
              No active access tokens
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Companies that you grant access to will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeAccess.map((access, index) => (
              <motion.div
                key={access.tokenId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {access.companyName}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                          Active
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Requested Data
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {access.requestedData.map((field, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Days Left:</span>
                            <span className={`font-semibold ${getDaysLeftColor(access.daysLeft)}`}>
                              {access.daysLeft} days
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Access Count:</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {access.accessCount}
                            </span>
                          </div>
                          {access.lastAccessedAt && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Last accessed:{' '}
                                {format(new Date(access.lastAccessedAt), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Expires: {format(new Date(access.expiresAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Token: {access.token}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke(access.tokenId)}
                    disabled={revoking === access.tokenId}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Revoke Access"
                  >
                    {revoking === access.tokenId ? (
                      <div className="animate-spin h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full"></div>
                    ) : (
                      <X className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

