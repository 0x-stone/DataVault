import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { vaultService, PersonalData } from '../services/vault.service';
import { Lock, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface PersonalDataForm {
  bvn: string;
  nin: string;
  dob: string;
  address: string;
}

// Helper function to check if a value is truncated/hashed (starts with ***)
const isTruncatedValue = (value: string | undefined): boolean => {
  return value ? value.startsWith('***') : false;
};

// Helper function to check if a value is valid (not truncated and not empty)
const isValidValue = (value: string | undefined, fieldKey: string): boolean => {
  if (!value || value.trim() === '') return false;
  if (isTruncatedValue(value)) return false;
  
  // Additional validation for specific fields
  if (fieldKey === 'bvn' || fieldKey === 'nin') {
    return /^\d{11}$/.test(value);
  }
  if (fieldKey === 'dob') {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }
  if (fieldKey === 'address') {
    return value.length >= 5;
  }
  return true;
};

export default function PersonalDataPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingData, setExistingData] = useState<Partial<PersonalData>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const originalValuesRef = useRef<Partial<PersonalDataForm>>({});
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PersonalDataForm>();

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await vaultService.getVaultData();
        setExistingData(data.personalData || {});
        
        // Store original values (but don't set form values for truncated ones)
        const originalValues: Partial<PersonalDataForm> = {};
        
        // Only set form values if they're not truncated/hashed
        // For truncated values, leave the field empty so user can enter new value
        Object.entries(data.personalData || {}).forEach(([key, value]) => {
          if (value && !isTruncatedValue(value)) {
            setValue(key as keyof PersonalDataForm, value);
            originalValues[key as keyof PersonalDataForm] = value;
          } else if (value && isTruncatedValue(value)) {
            // Store truncated value as original but don't set in form
            originalValues[key as keyof PersonalDataForm] = value;
          }
        });
        
        originalValuesRef.current = originalValues;
      } catch (error) {
        console.error('Failed to load personal data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [setValue]);

  const onSubmit = async (data: PersonalDataForm) => {
    setSaving(true);
    try {
      // Only send fields that were actually modified by the user
      const updates: Partial<PersonalData> = {};
      const originalValues = originalValuesRef.current;
      
      // Check each field to see if it was modified
      Object.entries(data).forEach(([key, currentValue]) => {
        const fieldKey = key as keyof PersonalDataForm;
        const originalValue = originalValues[fieldKey];
        
        // Skip if value is empty or unchanged
        if (!currentValue || currentValue.trim() === '') {
          return;
        }
        
        // Skip if value is truncated (shouldn't happen, but safety check)
        if (isTruncatedValue(currentValue)) {
          return;
        }
        
        // Only include if value is valid and different from original
        if (isValidValue(currentValue, key)) {
          // If original was truncated, this is a new value
          if (isTruncatedValue(originalValue)) {
            updates[fieldKey as keyof PersonalData] = currentValue;
          } 
          // If original exists and is different, it was modified
          else if (originalValue !== currentValue) {
            updates[fieldKey as keyof PersonalData] = currentValue;
          }
          // If no original value existed, this is new
          else if (!originalValue) {
            updates[fieldKey as keyof PersonalData] = currentValue;
          }
        }
      });
      
      // Only send request if there are actual updates
      if (Object.keys(updates).length > 0) {
        await vaultService.savePersonalData(updates);
        const vaultData = await vaultService.getVaultData();
        setExistingData(vaultData.personalData || {});
        
        // Update original values ref
        const newOriginalValues: Partial<PersonalDataForm> = {};
        Object.entries(vaultData.personalData || {}).forEach(([key, value]) => {
          if (value) {
            newOriginalValues[key as keyof PersonalDataForm] = value;
          }
        });
        originalValuesRef.current = newOriginalValues;
      } else {
        // No changes detected
        return;
      }
    } catch (error) {
      // Error handled by service
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = (field: string) => {
    setShowValues((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const fields = [
    {
      key: 'bvn' as const,
      label: 'BVN',
      placeholder: 'Bank Verification Number',
      description: 'Your 11-digit Bank Verification Number',
      mask: true,
    },
    {
      key: 'nin' as const,
      label: 'NIN',
      placeholder: 'National Identification Number',
      description: 'Your 11-digit National Identification Number',
      mask: true,
    },
    {
      key: 'dob' as const,
      label: 'Date of Birth',
      placeholder: 'YYYY-MM-DD',
      description: 'Your date of birth',
      type: 'date',
    },
    {
      key: 'address' as const,
      label: 'Address',
      placeholder: 'Your residential address',
      description: 'Your complete residential address',
      type: 'text',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">Personal Data</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Securely store and manage your personal information
        </p>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-8"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {fields.map((field, index) => {
            const hasValue = existingData[field.key];
            const isTruncated = hasValue && isTruncatedValue(existingData[field.key]);
            const isVisible = showValues[field.key];
            const currentFormValue = watch(field.key);
            const hasUnsavedChanges = currentFormValue && 
              currentFormValue.trim() !== '' && 
              currentFormValue !== originalValuesRef.current[field.key] &&
              !isTruncatedValue(currentFormValue);

            return (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {field.label}
                  {hasValue && !isTruncated && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                      Stored
                    </span>
                  )}
                  {hasValue && isTruncated && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                      Encrypted
                    </span>
                  )}
                  {hasUnsavedChanges && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                      Modified
                    </span>
                  )}
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {field.description}
                  {isTruncated && (
                    <span className="block mt-1 text-blue-600 dark:text-blue-400">
                      This field is encrypted. Enter a new value to update it.
                    </span>
                  )}
                </p>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    {...register(field.key, {
                      required: false,
                      pattern: field.key === 'bvn' || field.key === 'nin' 
                        ? { value: /^\d{11}$/, message: 'Must be 11 digits' }
                        : undefined,
                    })}
                    type={field.type || (field.mask && !isVisible ? 'password' : 'text')}
                    placeholder={isTruncated ? `Enter new ${field.label.toLowerCase()} to update` : field.placeholder}
                    className="w-full pl-10 pr-20 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {field.mask && hasValue && !isTruncated && (
                    <button
                      type="button"
                      onClick={() => toggleVisibility(field.key)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {isVisible ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
                {errors[field.key] && (
                  <p className="mt-1 text-sm text-red-600">{errors[field.key]?.message}</p>
                )}
              </motion.div>
            );
          })}

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Personal Data
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Security Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800"
      >
        <div className="flex items-start gap-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Lock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Encryption & Privacy
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              All personal data is encrypted before storage using industry-standard encryption
              methods. Your sensitive information remains secure and private.
            </p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>• AES-256 encryption</li>
              <li>• End-to-end data protection</li>
              <li>• Compliance with NDPR regulations</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

