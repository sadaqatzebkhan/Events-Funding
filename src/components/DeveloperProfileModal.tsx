import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Mail, X, Check, Copy } from 'lucide-react';

interface DeveloperProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperProfileModal: React.FC<DeveloperProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-10 text-slate-900 overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Profile Content */}
          <div className="flex flex-col items-center text-center">
            {/* Circular Profile Picture */}
            <div className="relative mb-3">
              <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-emerald-500/20 shadow-md bg-slate-100 mx-auto">
                <img
                  src="/developer_sadaqat.jpg"
                  alt="Sadaqat Zeb Khan"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo.png';
                  }}
                />
              </div>
            </div>

            {/* Name */}
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Sadaqat Zeb Khan
            </h2>
            <p className="text-xs font-semibold text-emerald-700 mt-0.5 mb-5">
              App Developer
            </p>

            {/* Contact Details List */}
            <div className="w-full space-y-2.5 text-left">
              {/* Phone */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-emerald-300 transition-colors">
                <a
                  href="tel:03426168609"
                  className="flex items-center gap-3 min-w-0 flex-1 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Phone size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Phone Number
                    </p>
                    <p className="text-sm font-bold text-slate-800 tracking-wide truncate group-hover:text-emerald-700">
                      03426168609
                    </p>
                  </div>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy('03426168609', 'phone')}
                  title="Copy phone number"
                  className="p-2 rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-white transition-colors cursor-pointer"
                >
                  {copiedField === 'phone' ? (
                    <Check size={16} className="text-emerald-600" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-emerald-300 transition-colors">
                <a
                  href="mailto:szkeducationalinfo@gmail.com"
                  className="flex items-center gap-3 min-w-0 flex-1 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Mail size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Email Address
                    </p>
                    <p className="text-xs font-bold text-slate-800 tracking-tight truncate group-hover:text-blue-700">
                      szkeducationalinfo@gmail.com
                    </p>
                  </div>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy('szkeducationalinfo@gmail.com', 'email')}
                  title="Copy email"
                  className="p-2 rounded-xl text-slate-400 hover:text-blue-700 hover:bg-white transition-colors cursor-pointer"
                >
                  {copiedField === 'email' ? (
                    <Check size={16} className="text-emerald-600" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Close action button */}
            <button
              onClick={onClose}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
