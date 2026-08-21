import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { MemberDetailsResponse } from '../types';
import {
  UserCircle,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  KeyRound,
  Phone,
  MessageSquare,
  MapPin,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  Calendar,
  Coins,
  Receipt,
  User,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { ProfileSkeleton } from '../components/Skeleton';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();

  // Active tab: 'details' | 'history' | 'security'
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'security'>('details');

  // Member stats & event history
  const [memberData, setMemberData] = useState<MemberDetailsResponse | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Profile Edit Form State
  const [name, setName] = useState(user?.name || '');
  const [fatherName, setFatherName] = useState(user?.fatherName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [address, setAddress] = useState(user?.address || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Copy feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load member details & history
  const fetchMemberStats = async () => {
    if (!user?.id) return;
    setIsLoadingStats(true);
    try {
      const token = localStorage.getItem('mf_token');
      const res = await fetch(`/api/members/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        setMemberData(json);
      }
    } catch (err) {
      console.error('Failed to fetch personal stats', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setFatherName(user.fatherName || '');
      setPhone(user.phone || '');
      setWhatsapp(user.whatsapp || user.phone || '');
      setAddress(user.address || '');
      fetchMemberStats();
    }
  }, [user]);

  const handleCopy = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileError('Full Name is required.');
      return;
    }

    setIsUpdatingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    const res = await updateProfile({
      name: name.trim(),
      fatherName: fatherName.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      address: address.trim(),
    });

    if (res.success) {
      setProfileSuccess('Profile information updated successfully!');
      fetchMemberStats();
      setTimeout(() => setProfileSuccess(null), 4000);
    } else {
      setProfileError(res.error || 'Failed to update profile.');
    }
    setIsUpdatingProfile(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill out all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    const res = await changePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (res.success) {
      setPasswordSuccess(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } else {
      setPasswordError(res.error || 'Failed to change password.');
    }
    setIsChangingPassword(false);
  };

  const totalContributed = memberData?.summary?.totalPaid ?? 0;
  const totalPending = memberData?.summary?.totalPending ?? 0;
  const totalEvents = memberData?.summary?.totalEvents ?? 0;
  const paidEvents = memberData?.summary?.paidEvents ?? 0;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 pb-24">
      {/* 1. EXECUTIVE PROFILE WHITE HERO CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-white text-slate-900 p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          {/* Avatar and Identity */}
          <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold text-2xl sm:text-3xl flex items-center justify-center ring-4 ring-emerald-50">
                {user?.name ? user.name[0].toUpperCase() : <User size={28} />}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 ring-2 ring-white flex items-center justify-center text-white text-[10px]" title="Active Member">
                ✓
              </span>
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 break-words min-w-0"
                  title={user?.name || undefined}
                >
                  {user?.name || 'Member'}
                </h1>
                <span
                  className={`shrink-0 text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    user?.role === 'admin'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : user?.role === 'viewer'
                      ? 'bg-purple-50 text-purple-800 border border-purple-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                >
                  {user?.role === 'admin'
                    ? 'Admin'
                    : user?.role === 'viewer'
                    ? 'View-Only (Observer)'
                    : 'Contributing Member'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-medium break-words">
                Son/Daughter of <strong className="text-slate-900">{user?.fatherName || '-'}</strong>
              </p>

              <div className="flex items-center gap-2.5 pt-1 text-xs text-slate-500 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleCopy(user?.username || '', 'username')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-medium max-w-full"
                  title="Click to copy username"
                >
                  <span className="truncate">@{user?.username}</span>
                  {copiedField === 'username' ? (
                    <Check size={12} className="text-emerald-600 shrink-0" />
                  ) : (
                    <Copy size={12} className="text-slate-400 shrink-0" />
                  )}
                </button>

                {user?.address && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 max-w-full">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{user.address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Contact Badges */}
          <div className="flex sm:flex-col gap-2 shrink-0 max-w-full">
            {user?.phone && (
              <a
                href={`tel:${user.phone}`}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-2 transition-colors"
              >
                <Phone size={13} className="text-emerald-600 shrink-0" />
                <span>{user.phone}</span>
              </a>
            )}
            {user?.whatsapp && (
              <a
                href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-2 transition-colors"
              >
                <MessageSquare size={13} className="text-emerald-600 shrink-0" />
                <span>WhatsApp Chat</span>
              </a>
            )}
          </div>
        </div>

        {/* Financial Summary Metric Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium block">
              {user?.role === 'viewer' ? 'Account Type' : 'Total Contributed'}
            </span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-700 mt-0.5 block">
              {user?.role === 'viewer' ? 'Observer' : formatCurrency(totalContributed)}
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium block">
              {user?.role === 'viewer' ? 'Contributions' : 'Events Completed'}
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 block">
              {user?.role === 'viewer' ? 'Exempt' : `${paidEvents} / ${totalEvents}`}
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium block">
              Outstanding Due
            </span>
            <span className={`text-sm sm:text-base font-extrabold mt-0.5 block ${totalPending > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
              {user?.role === 'viewer' ? 'Rs 0 (No Dues)' : totalPending > 0 ? formatCurrency(totalPending) : 'All Cleared'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. SEGMENTED TAB SELECTOR */}
      <div className="flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'details'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <UserCircle size={16} className={activeTab === 'details' ? 'text-emerald-600' : 'text-slate-400'} />
          <span>Personal Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Receipt size={16} className={activeTab === 'history' ? 'text-emerald-600' : 'text-slate-400'} />
          <span>{user?.role === 'viewer' ? 'My Records (Exempt)' : `My Contributions (${totalEvents})`}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck size={16} className={activeTab === 'security' ? 'text-emerald-600' : 'text-slate-400'} />
          <span>Security</span>
        </button>
      </div>

      {/* 3. TAB CONTENT AREA */}

      {/* TAB 1: PERSONAL DETAILS */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCircle size={20} className="text-emerald-600" />
              <span>Update Family Profile Info</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Keep your contact information up-to-date for family notifications and records
            </p>
          </div>

          {profileSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-800 flex items-center gap-2.5">
              <AlertCircle size={17} className="text-rose-600 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tariq Khan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Father's Name
                </label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="e.g. Haji Muhammad Khan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Phone size={15} />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
                    <MessageSquare size={15} />
                  </span>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Residential Address / City
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <MapPin size={15} />
                </span>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. House #12, Street 4, Peshawar"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Save size={16} />
                <span>{isUpdatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MY EVENT CONTRIBUTIONS */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Coins size={20} className="text-emerald-600" />
                <span>My Event Contribution History</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Record of all family events, base requirements, and your paid contributions
              </p>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-xs text-slate-400 block font-medium">Cumulative Paid</span>
              <span className="text-base font-bold text-emerald-700">{formatCurrency(totalContributed)}</span>
            </div>
          </div>

          {isLoadingStats ? (
            <ProfileSkeleton />
          ) : !memberData?.history || memberData.history.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-1">
              <Receipt size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-800">
                {user?.role === 'viewer'
                  ? 'Observer Account — Exempt from Contribution Rosters'
                  : 'No event records found yet.'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                {user?.role === 'viewer'
                  ? 'As a View-Only member, you are not assigned payment shares or contribution dues.'
                  : 'When new events are created, your contribution status will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {memberData.history.map((item) => {
                const { event, paymentRecord, transactions } = item;
                const extraPaid = Math.max(0, paymentRecord.paidAmount - paymentRecord.requiredAmount);

                return (
                  <div
                    key={event.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-slate-300 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{event.name}</h4>
                          <StatusBadge status={paymentRecord.status} size="sm" />
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{formatDate(event.date)}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block font-medium">Contributed</span>
                        <span className="text-sm font-extrabold text-emerald-700">
                          {formatCurrency(paymentRecord.paidAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown metrics */}
                    <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-100 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Base Required</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(paymentRecord.requiredAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Remaining Due</span>
                        <span className={`font-semibold ${paymentRecord.pendingAmount > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                          {paymentRecord.pendingAmount > 0 ? formatCurrency(paymentRecord.pendingAmount) : 'Nil (Paid)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Extra Pool Add</span>
                        <span className={`font-semibold ${extraPaid > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {extraPaid > 0 ? `+${formatCurrency(extraPaid)}` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Transactions list if any */}
                    {transactions && transactions.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Receipts ({transactions.length})
                        </span>
                        {transactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-100"
                          >
                            <span className="text-slate-500 text-[11px]">{formatDate(tx.date)} {tx.note && `• ${tx.note}`}</span>
                            <span className="font-bold text-slate-900">+{formatCurrency(tx.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SECURITY & PASSWORD */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <KeyRound size={20} className="text-emerald-600" />
              <span>Change Login Password</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Ensure your account is protected with a secure, confidential password
            </p>
          </div>

          {passwordSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-800 flex items-center gap-2.5">
              <AlertCircle size={17} className="text-rose-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-start">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Lock size={16} />
                <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
