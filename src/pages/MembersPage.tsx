import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { MemberModal } from '../components/MemberModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { MembersSkeleton } from '../components/Skeleton';

interface MembersPageProps {
  onSelectMember: (memberId: string) => void;
}

export const MembersPage: React.FC<MembersPageProps> = ({ onSelectMember }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'contributing' | 'viewer'>('all');

  // Modals
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<User | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('mf_token');
      const res = await fetch('/api/members', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch family members');
      }

      const data = await res.json();
      setMembers(data.members || []);
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
  
    try {
      const token = localStorage.getItem('mf_token');
      const res = await fetch(`/api/members/${memberToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to deactivate member');
      }

      setMemberToDelete(null);
      fetchMembers();
    } catch (err: any) {
      alert(err.message || 'Error deactivating member');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(q) ||
      (m.fatherName && m.fatherName.toLowerCase().includes(q)) ||
      m.phone.includes(q) ||
      m.username.toLowerCase().includes(q);

    const matchesRole =
      roleFilter === 'all'
        ? true
        : roleFilter === 'contributing'
        ? m.role === 'member' || m.role === 'admin'
        : m.role === 'viewer';

    return matchesSearch && matchesRole;
  });

  const memberCounts = {
    all: members.length,
    contributing: members.filter((m) => m.role === 'member' || m.role === 'admin').length,
    viewers: members.filter((m) => m.role === 'viewer').length,
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Family Members Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registered family members, role permissions, and financial contribution status
          </p>
        </div>

        {/* Admin "+ New Member" button (Section 14 & 15) */}
        {user?.role === 'admin' && (
          <button
            id="add-new-member-btn"
            onClick={() => {
              setMemberToEdit(null);
              setIsMemberModalOpen(true);
            }}
            className="px-4.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus size={18} />
            <span>+ New Member</span>
          </button>
        )}
      </div>

      {/* Search & Role Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={17} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by member name, father name, or phone number..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-slate-400 bg-white"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto text-xs font-semibold shrink-0">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({memberCounts.all})
          </button>
          <button
            onClick={() => setRoleFilter('contributing')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'contributing'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Contributing ({memberCounts.contributing})
          </button>
          <button
            onClick={() => setRoleFilter('viewer')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'viewer'
                ? 'bg-white text-purple-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            View Only ({memberCounts.viewers})
          </button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <MembersSkeleton />
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm">
          {error}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Users size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {searchTerm || roleFilter !== 'all' ? 'No matching members found' : 'No family members found.'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {user?.role === 'admin'
              ? 'Add family members to associate them with family events and contributions.'
              : 'Family members will appear here once added.'}
          </p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW (Section 14.1) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Name & Role</th>
                  <th className="py-3.5 px-6">Father Name</th>
                  <th className="py-3.5 px-6">Phone / WhatsApp</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Pending Dues</th>
                  <th className="py-3.5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredMembers.map((mem) => (
                  <tr key={mem.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectMember(mem.id)}
                          className="text-left font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          {mem.name}
                        </button>
                        {mem.role === 'admin' && (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Admin
                          </span>
                        )}
                        {mem.role === 'viewer' && (
                          <span className="text-[10px] font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            View-Only
                          </span>
                        )}
                        {mem.role === 'member' && (
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            Contributing
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {mem.fatherName || '-'}
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-400" />
                        <span>{mem.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          mem.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {mem.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {mem.role === 'viewer' ? (
                        <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                          Exempt (Observer)
                        </span>
                      ) : (mem.totalPending || 0) > 0 ? (
                        <span className="font-bold text-rose-700">
                          {formatCurrency(mem.totalPending)}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center justify-end gap-1">
                          <CheckCircle2 size={13} /> Clear
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`view-member-${mem.id}`}
                          onClick={() => onSelectMember(mem.id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="View member profile and complete event payment history"
                        >
                          <Eye size={14} />
                          <span>View History</span>
                        </button>

                        {user?.role === 'admin' && (
                          <>
                            <button
                              id={`edit-member-${mem.id}`}
                              onClick={() => {
                                setMemberToEdit(mem);
                                setIsMemberModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              title="Edit Member Details"
                            >
                              <Edit2 size={15} />
                            </button>
                            {mem.id !== user.id && (
                              <button
                                id={`delete-member-${mem.id}`}
                                onClick={() => setMemberToDelete(mem)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Deactivate Member"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE RESPONSIVE CARDS VIEW (Section 14.1 & 28) */}
          <div className="md:hidden space-y-3">
            {filteredMembers.map((mem) => (
              <div
                key={mem.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => onSelectMember(mem.id)}
                    className="text-left min-w-0 flex-1"
                  >
                    <h3 className="font-bold text-base text-slate-900 active:text-blue-600 break-words">
                      {mem.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 break-words">S/O {mem.fatherName || '-'}</p>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    {mem.role === 'admin' && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Admin
                      </span>
                    )}
                    {mem.role === 'viewer' && (
                      <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                        View-Only
                      </span>
                    )}
                    {mem.role === 'member' && (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        Contributing
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Phone</span>
                    <span className="font-semibold text-slate-800">{mem.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contribution Status</span>
                    {mem.role === 'viewer' ? (
                      <span className="font-bold text-purple-700 block mt-0.5">
                        Exempt (Observer)
                      </span>
                    ) : (
                      <span
                        className={`font-bold block mt-0.5 ${
                          (mem.totalPending || 0) > 0 ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {(mem.totalPending || 0) > 0 ? formatCurrency(mem.totalPending || 0) : 'Clear (No Dues)'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <button
                    onClick={() => onSelectMember(mem.id)}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Eye size={15} />
                    <span>View Member History</span>
                  </button>

                  {user?.role === 'admin' && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => {
                          setMemberToEdit(mem);
                          setIsMemberModalOpen(true);
                        }}
                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
                      >
                        <Edit2 size={16} />
                      </button>
                      {mem.id !== user.id && (
                        <button
                          onClick={() => setMemberToDelete(mem)}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Member Modal */}
      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        memberToEdit={memberToEdit}
        onSuccess={fetchMembers}
      />

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleDeleteMember}
        isLoading={isDeleting}
        title="Deactivate Family Member?"
        message={`Are you sure you want to deactivate "${memberToDelete?.name}"?\n\nHistorical financial integrity is fully preserved: all past event payments and contribution logs will remain in the records.`}
        confirmText="Yes, Deactivate Member"
      />
    </div>
  );
};
