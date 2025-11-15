import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { vaultService, VaultData, AccessLog } from '../services/vault.service';
import { Shield, FileText, Lock, Activity, TrendingUp, AlertCircle, User, Calendar, MapPin, CreditCard, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { format } from 'date-fns';

// Helper to check if value is truncated
const isTruncatedValue = (value: string | undefined): boolean => {
  return value ? value.startsWith('***') : false;
};

// Field configuration for personal data
const personalDataFields = [
  { key: 'bvn', label: 'Bank Verification Number', icon: CreditCard, color: 'from-blue-500 to-cyan-500' },
  { key: 'nin', label: 'National ID Number', icon: User, color: 'from-purple-500 to-pink-500' },
  { key: 'dob', label: 'Date of Birth', icon: Calendar, color: 'from-green-500 to-emerald-500' },
  { key: 'address', label: 'Address', icon: MapPin, color: 'from-orange-500 to-red-500' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [stats, setStats] = useState({
    documentsCount: 0,
    personalDataFields: 0,
    activeAccess: 0,
    recentLogs: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await vaultService.getVaultData();
        setVaultData(data);
        
        const documentsCount = Object.values(data.documents || {}).filter(Boolean).length;
        const personalDataFields = Object.values(data.personalData || {}).filter(Boolean).length;
        
        const [activeAccess, logs] = await Promise.all([
          vaultService.getActiveAccess(),
          vaultService.getAccessLogs(),
        ]);

        setAccessLogs(logs);
        setStats({
          documentsCount,
          personalDataFields,
          activeAccess: activeAccess.length,
          recentLogs: logs.length,
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const statCards = [
    {
      title: 'Documents',
      value: stats.documentsCount,
      total: 5,
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      link: '/documents',
    },
    {
      title: 'Personal Data',
      value: stats.personalDataFields,
      total: 4,
      icon: Lock,
      color: 'from-purple-500 to-pink-500',
      link: '/personal-data',
    },
    {
      title: 'Active Access',
      value: stats.activeAccess,
      icon: Shield,
      color: 'from-green-500 to-emerald-500',
      link: '/active-access',
    },
    {
      title: 'Access Logs',
      value: stats.recentLogs,
      icon: Activity,
      color: 'from-orange-500 to-red-500',
      link: '/access-logs',
    },
  ];

  // Prepare data for donut chart (completion status)
  const completionData = [
    { name: 'Completed', value: stats.personalDataFields + stats.documentsCount, fill: '#8b5cf6' },
    { name: 'Remaining', value: 9 - (stats.personalDataFields + stats.documentsCount), fill: '#e2e8f0' },
  ];

  // Prepare data for access activity chart (last 7 days or available logs)
  const getAccessActivityData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return format(date, 'MMM dd');
    });

    const logCounts = last7Days.map(day => {
      const count = accessLogs.filter(log => {
        const logDate = format(new Date(log.timestamp), 'MMM dd');
        return logDate === day;
      }).length;
      return { date: day, accesses: count };
    });

    return logCounts;
  };

  const accessActivityData = getAccessActivityData();

  // Prepare data for document types breakdown
  const documentTypesData = vaultData?.documents
    ? Object.entries(vaultData.documents)
        .filter(([_, value]) => value)
        .map(([key, _]) => ({
          name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: 1,
        }))
    : [];

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">
          Welcome back, {user?.fullname?.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Here's an overview of your secure data vault
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={stat.link}>
              <div className="glass rounded-2xl p-6 card-hover cursor-pointer border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  {stat.total && (
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-3 py-1 rounded-full">
                      {stat.value}/{stat.total}
                    </span>
                  )}
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.title}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Charts and Personal Data Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Data Cards - Elegant Display */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="glass rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Personal Data
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Your encrypted personal information
                </p>
              </div>
              <Link
                to="/personal-data"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
              >
                Manage →
              </Link>
            </div>
            
            {vaultData && Object.keys(vaultData.personalData || {}).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personalDataFields.map((field) => {
                  const value = vaultData.personalData?.[field.key as keyof typeof vaultData.personalData];
                  const hasValue = !!value;
                  const isTruncated = hasValue && isTruncatedValue(value);
                  const Icon = field.icon;

                  return (
                    <motion.div
                      key={field.key}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative overflow-hidden rounded-xl p-5 border border-slate-200/50 dark:border-slate-700/50 ${
                        hasValue 
                          ? 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50' 
                          : 'bg-slate-50/50 dark:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${field.color} shadow-md`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                            {field.label}
                          </p>
                          {hasValue ? (
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">
                                {isTruncated ? value : value}
                              </p>
                              {isTruncated && (
                                <Eye className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                              Not provided
                            </p>
                          )}
                          {hasValue && (
                            <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full font-medium ${
                              isTruncated
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            }`}>
                              {isTruncated ? 'Encrypted' : 'Stored'}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 mb-4">
                  <Lock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4 font-medium">
                  No personal data stored yet
                </p>
                <Link
                  to="/personal-data"
                  className="inline-block px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                >
                  Add Personal Data
                </Link>
              </div>
            )}
          </div>

          {/* Access Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Access Activity
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Data access over the last 7 days
                </p>
              </div>
              <Activity className="h-6 w-6 text-orange-500" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={accessActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  className="text-xs"
                />
                <YAxis 
                  stroke="#64748b"
                  className="text-xs"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="accesses" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>

        {/* Charts Column */}
        <div className="space-y-6">
          {/* Completion Donut Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                Data Completion
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Profile completion status
              </p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {Math.round((completionData[0].value / 9) * 100)}%
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Complete
              </p>
            </div>
          </motion.div>

          {/* Documents Breakdown */}
          {documentTypesData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50"
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Documents
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Uploaded document types
                </p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={documentTypesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b"
                    className="text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#64748b"
                    className="text-xs"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      </div>

      {/* Documents Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Documents
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Your uploaded identity documents
            </p>
          </div>
          <Link
            to="/documents"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
          >
            Manage →
          </Link>
        </div>
        {vaultData && Object.keys(vaultData.documents || {}).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(vaultData.documents || {}).map(([key, value]) => (
              value && (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">
                      {key.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                    Uploaded
                  </span>
                </motion.div>
              )
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 mb-4">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4 font-medium">
              No documents uploaded yet
            </p>
            <Link
              to="/documents"
              className="inline-block px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              Upload Documents
            </Link>
          </div>
        )}
      </motion.div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-800/50"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl shadow-sm">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">
              Your data is encrypted and secure
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              All documents and personal information are encrypted using industry-standard AES-256 encryption
              methods. Your sensitive data remains private and secure, accessible only by you.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
