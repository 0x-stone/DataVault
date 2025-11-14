import { useState, useEffect } from 'react';
import { vaultService, AccessLog } from '../services/vault.service';
import { History, Building2, Calendar, Shield, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function AccessLogs() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await vaultService.getAccessLogs();
        setLogs(data);
      } catch (error) {
        console.error('Failed to load access logs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'read':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'request_approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'request_denied':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'token_revoked':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'read':
        return History;
      case 'request_approved':
        return Shield;
      case 'request_denied':
        return AlertCircle;
      case 'token_revoked':
        return Shield;
      default:
        return History;
    }
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
        <h1 className="text-4xl font-bold gradient-text mb-2">Access Logs</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Track all access requests and data access activities
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
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Logs</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {logs.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <History className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Read Actions</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {logs.filter((log) => log.action === 'read').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
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
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Unique Companies</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {new Set(logs.map((log) => log.companyId)).size}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Logs List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6"
      >
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">
              No access logs yet
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Access logs will appear here when companies request access to your data
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log, index) => {
              const ActionIcon = getActionIcon(log.action);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`p-2 rounded-lg ${getActionColor(log.action)}`}
                      >
                        <ActionIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {log.companyName}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getActionColor(log.action)}`}
                          >
                            {log.action.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {log.description}
                        </p>
                        {log.dataAccessed && log.dataAccessed.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {log.dataAccessed.map((field, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}






