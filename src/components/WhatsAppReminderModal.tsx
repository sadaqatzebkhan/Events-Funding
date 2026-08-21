import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Send,
  User,
  Phone,
  Calendar,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import { EventMemberPayment } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  generateReminderMessage,
  normalizeWhatsAppNumber,
  openWhatsAppDirect,
  ReminderTemplateType,
} from '../utils/whatsapp';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  eventDate?: string;
  paymentRecord: EventMemberPayment | null;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  isOpen,
  onClose,
  eventName,
  eventDate,
  paymentRecord,
}) => {
  const [template, setTemplate] = useState<ReminderTemplateType>('roman_urdu');
  const [customMessage, setCustomMessage] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && paymentRecord) {
      const initialPhone = paymentRecord.memberWhatsapp || paymentRecord.memberPhone || '';
      setRecipientPhone(initialPhone);

      const msg = generateReminderMessage(template, {
        memberName: paymentRecord.memberName,
        eventName: eventName,
        eventDate: eventDate,
        requiredAmount: paymentRecord.requiredAmount,
        paidAmount: paymentRecord.paidAmount,
        pendingAmount: paymentRecord.pendingAmount,
      });
      setCustomMessage(msg);
      setCopied(false);
    }
  }, [isOpen, paymentRecord, eventName, eventDate]);

  // When user switches templates, regenerate message
  const handleTemplateChange = (newTemplate: ReminderTemplateType) => {
    setTemplate(newTemplate);
    if (paymentRecord) {
      const msg = generateReminderMessage(newTemplate, {
        memberName: paymentRecord.memberName,
        eventName: eventName,
        eventDate: eventDate,
        requiredAmount: paymentRecord.requiredAmount,
        paidAmount: paymentRecord.paidAmount,
        pendingAmount: paymentRecord.pendingAmount,
      });
      setCustomMessage(msg);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(customMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const handleSendWhatsApp = () => {
    openWhatsAppDirect(recipientPhone, customMessage);
  };

  if (!isOpen || !paymentRecord) return null;

  const normalizedPhone = normalizeWhatsAppNumber(recipientPhone);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-reminder-modal-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <MessageCircle size={18} />
            </div>
            <div>
              <h2
                id="whatsapp-reminder-modal-title"
                className="text-sm sm:text-base font-bold text-slate-900 leading-tight"
              >
                Send WhatsApp Payment Reminder
              </h2>
              <p className="text-xs text-slate-500">
                Formal reminder for pending event contribution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body - Scrollable */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Member & Pending Dues Snapshot */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                  <User size={14} />
                </div>
                <div className="truncate">
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {paymentRecord.memberName}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {paymentRecord.memberFatherName ? `S/O ${paymentRecord.memberFatherName}` : 'Member'}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 font-medium block">Pending Balance</span>
                <span className="text-xs sm:text-sm font-extrabold text-rose-700">
                  {formatCurrency(paymentRecord.pendingAmount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">{eventName} ({formatDate(eventDate)})</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 justify-end">
                <DollarSign size={13} className="text-slate-400 shrink-0" />
                <span>Req: {formatCurrency(paymentRecord.requiredAmount)} | Paid: {formatCurrency(paymentRecord.paidAmount)}</span>
              </div>
            </div>
          </div>

          {/* Recipient Phone Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              WhatsApp Recipient Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone size={14} />
              </div>
              <input
                type="text"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="e.g. 03001234567"
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            {normalizedPhone && (
              <p className="text-[10px] text-slate-400 mt-1">
                WhatsApp Link: <span className="font-mono text-emerald-700">+{normalizedPhone}</span>
              </p>
            )}
          </div>

          {/* Template Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Message Tone & Language
              </label>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-500" />
                Formal Template
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleTemplateChange('roman_urdu')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center cursor-pointer ${
                  template === 'roman_urdu'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Roman Urdu
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('urdu')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center cursor-pointer ${
                  template === 'urdu'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                اردو (Urdu)
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('english')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center cursor-pointer ${
                  template === 'english'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Editable Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Message Preview (Editable)
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={8}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              dir={template === 'urdu' ? 'rtl' : 'ltr'}
              className={`w-full p-3 rounded-2xl border border-slate-300 text-slate-900 text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none font-sans bg-slate-50/50 ${
                template === 'urdu' ? 'text-right font-medium' : ''
              }`}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="py-2.5 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Message</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="send-whatsapp-btn"
            onClick={handleSendWhatsApp}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Send size={14} />
            <span>Open & Send on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
