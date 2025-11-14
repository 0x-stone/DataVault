import { useState, useRef } from 'react';
import { vaultService } from '../services/vault.service';
import { Upload, FileText, X, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const documentTypes = [
  { key: 'nin_front', label: 'NIN Front', description: 'National Identification Number (Front)' },
  { key: 'nin_back', label: 'NIN Back', description: 'National Identification Number (Back)' },
  { key: 'passport', label: 'Passport', description: 'International Passport' },
  { key: 'driver_license', label: 'Driver License', description: 'Driver\'s License' },
  { key: 'utility_bill', label: 'Utility Bill', description: 'Utility Bill (Recent)' },
];

export default function Documents() {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelect = async (documentType: string, file: File | null) => {
    if (!file) return;

    setUploading((prev) => ({ ...prev, [documentType]: true }));
    try {
      await vaultService.uploadDocument(file, documentType);
      setUploaded((prev) => ({ ...prev, [documentType]: true }));
    } catch (error) {
      // Error handled by service
    } finally {
      setUploading((prev) => ({ ...prev, [documentType]: false }));
    }
  };

  const handleDrop = (e: React.DragEvent, documentType: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(documentType, file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">Documents</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Upload and manage your identification documents securely
        </p>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documentTypes.map((doc, index) => (
          <motion.div
            key={doc.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div
              className="glass rounded-xl p-6 card-hover"
              onDrop={(e) => handleDrop(e, doc.key)}
              onDragOver={handleDragOver}
            >
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 mb-3">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  {doc.label}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{doc.description}</p>
              </div>

              {uploaded[doc.key] ? (
                <div className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Uploaded
                  </span>
                </div>
              ) : (
                <div>
                  <input
                    ref={(el) => (fileInputRefs.current[doc.key] = el)}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleFileSelect(doc.key, file);
                    }}
                  />
                  <button
                    onClick={() => fileInputRefs.current[doc.key]?.click()}
                    disabled={uploading[doc.key]}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading[doc.key] ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        Upload Document
                      </>
                    )}
                  </button>
                  <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
                    Drag & drop or click to upload
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800"
      >
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Secure Document Storage
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              All documents are encrypted before storage. Supported formats: JPG, PNG, PDF. Maximum
              file size: 10MB.
            </p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>• End-to-end encryption</li>
              <li>• Secure cloud storage</li>
              <li>• Access control management</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}






