import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, LayoutGrid, List, Phone, BookOpen,
  Clock, XCircle, CheckCircle2, Loader2, Pencil, Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Enquiry, LeadStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; icon: React.ElementType }> = {
  FOLLOW_UP: { label: 'Follow Up', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  NOT_INTERESTED: { label: 'Not Interested', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  JOINED: { label: 'Joined', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
};

const KANBAN_COLUMNS: LeadStatus[] = ['FOLLOW_UP', 'NOT_INTERESTED', 'JOINED'];

const COLUMN_STYLES: Record<LeadStatus, string> = {
  FOLLOW_UP: 'border-t-yellow-400',
  NOT_INTERESTED: 'border-t-red-400',
  JOINED: 'border-t-green-500',
};

export default function EnquiriesPage() {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const data = await api.get<{ enquiries: Enquiry[] }>(`/enquiries?${params}`);
      setEnquiries(data.enquiries);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchEnquiries, 300);
    return () => clearTimeout(t);
  }, [fetchEnquiries]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this enquiry?')) return;
    setDeleting(id);
    try {
      await api.delete(`/enquiries/${id}`);
      setEnquiries((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusChange = async (id: string, leadStatus: LeadStatus) => {
    await api.put(`/enquiries/${id}`, { leadStatus });
    setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, leadStatus } : e)));
  };

  const byStatus = (status: LeadStatus) => enquiries.filter((e) => e.leadStatus === status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
          <p className="text-sm text-gray-500">Track walk-in enquiries and follow-ups</p>
        </div>
        <Button onClick={() => navigate('/enquiries/new')}>
          <Plus className="mr-2 h-4 w-4" /> New Enquiry
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, phone, course…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex rounded-md border border-gray-200 overflow-hidden w-fit">
          <button
            onClick={() => setView('kanban')}
            className={cn('px-3 py-2 text-sm flex items-center gap-1.5', view === 'kanban' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}
          >
            <LayoutGrid className="h-4 w-4" /> Board
          </button>
          <button
            onClick={() => setView('list')}
            className={cn('px-3 py-2 text-sm flex items-center gap-1.5 border-l border-gray-200', view === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}
          >
            <List className="h-4 w-4" /> List
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {KANBAN_COLUMNS.map((status) => {
            const { label, icon: Icon } = STATUS_CONFIG[status];
            const items = byStatus(status);
            return (
              <div key={status} className={cn('rounded-xl border-t-4 bg-white border border-gray-200 shadow-sm flex flex-col', COLUMN_STYLES[status])}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold text-gray-800 text-sm">{label}</span>
                  </div>
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                    {items.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[60vh]">
                  {items.length === 0 && (
                    <p className="text-center text-xs text-gray-400 py-6">No enquiries</p>
                  )}
                  {items.map((e) => (
                    <EnquiryCard
                      key={e.id}
                      enquiry={e}
                      onEdit={() => navigate(`/enquiries/${e.id}/edit`)}
                      onDelete={() => handleDelete(e.id)}
                      onStatusChange={(s) => handleStatusChange(e.id, s)}
                      deleting={deleting === e.id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Course</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enquiries.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No enquiries found</td></tr>
              )}
              {enquiries.map((e) => {
                const { label, color } = STATUS_CONFIG[e.leadStatus];
                return (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{e.name}</td>
                    <td className="px-4 py-3 text-gray-600">{e.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{e.course}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', color)}>
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(e.enquiryDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate(`/enquiries/${e.id}/edit`)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(e.id)} disabled={deleting === e.id} className="p-1.5 rounded hover:bg-red-50 text-red-400">
                          {deleting === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EnquiryCard({
  enquiry: e, onEdit, onDelete, onStatusChange, deleting,
}: {
  enquiry: Enquiry;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: LeadStatus) => void;
  deleting: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-gray-900 text-sm leading-tight">{e.name}</p>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="p-1 rounded hover:bg-gray-200 text-gray-400">
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={onDelete} disabled={deleting} className="p-1 rounded hover:bg-red-100 text-red-400">
            {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Phone className="h-3 w-3" /> {e.phone}
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <BookOpen className="h-3 w-3" /> {e.course}
      </div>
      {e.notes && <p className="text-xs text-gray-400 italic truncate">{e.notes}</p>}
      <div className="pt-1">
        <select
          value={e.leadStatus}
          onChange={(ev) => onStatusChange(ev.target.value as LeadStatus)}
          className="w-full text-xs rounded border border-gray-200 bg-white px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="FOLLOW_UP">Follow Up</option>
          <option value="NOT_INTERESTED">Not Interested</option>
          <option value="JOINED">Joined</option>
        </select>
      </div>
      <p className="text-xs text-gray-400">{new Date(e.enquiryDate).toLocaleDateString('en-IN')}</p>
    </div>
  );
}
