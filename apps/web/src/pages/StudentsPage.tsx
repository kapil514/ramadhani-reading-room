import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Loader2, Eye, Pencil, Phone, BookOpen, BadgeCheck } from 'lucide-react';
import { api } from '@/lib/api';
import type { Student, StudentStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<StudentStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  EXPIRED: 'bg-red-100 text-red-700 border-red-200',
  PAUSED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LEFT: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'LEFT', label: 'Left' },
];

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', String(limit));
      const data = await api.get<{ students: Student[]; total: number }>(`/students?${params}`);
      setStudents(data.students);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    const t = setTimeout(fetchStudents, 300);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500">{total} student{total !== 1 ? 's' : ''} registered</p>
        </div>
        <Button onClick={() => navigate('/students/new')}>
          <Plus className="mr-2 h-4 w-4" /> Register Student
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, phone, ID, course…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">No students found</p>
            <p className="text-sm mt-1">Register your first student to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Course</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Cabin</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Membership</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s) => {
                const activeMembership = s.memberships?.[0];
                const daysLeft = activeMembership
                  ? Math.ceil((new Date(activeMembership.endDate).getTime() - Date.now()) / 86400000)
                  : null;

                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                          {s.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{s.name}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="h-3 w-3" />{s.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{s.studentCode}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[120px]">{s.course ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                      {activeMembership?.cabin ? (
                        <span className="font-medium">{activeMembership.cabin.cabinNo}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {activeMembership ? (
                        <div>
                          <p className="text-xs text-gray-600">
                            Until {new Date(activeMembership.endDate).toLocaleDateString('en-IN')}
                          </p>
                          {daysLeft !== null && (
                            <p className={cn('text-xs font-medium', daysLeft <= 7 ? 'text-red-600' : daysLeft <= 30 ? 'text-yellow-600' : 'text-green-600')}>
                              {daysLeft < 0 ? 'Expired' : `${daysLeft}d left`}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No membership</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', STATUS_STYLES[s.status])}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/students/${s.id}`)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="View">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => navigate(`/students/${s.id}/edit`)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['ACTIVE', 'EXPIRED', 'PAUSED', 'LEFT'] as StudentStatus[]).map((s) => {
          const count = students.filter((st) => st.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                statusFilter === s ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:bg-gray-50'
              )}
            >
              <p className="text-lg font-bold text-gray-900">{count}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <BadgeCheck className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-500">{s}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
