import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, DoorOpen, Lock, User, Calendar, Phone,
  LayoutGrid, Plus, RefreshCw, X,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Cabin, Locker, CabinStatus, LockerStatus, Student } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CABIN_STATUS_STYLES: Record<CabinStatus, { bg: string; border: string; badge: string; label: string }> = {
  VACANT:       { bg: 'bg-green-50 hover:bg-green-100',  border: 'border-green-300',  badge: 'bg-green-100 text-green-700',   label: 'Vacant' },
  OCCUPIED:     { bg: 'bg-blue-50 hover:bg-blue-100',    border: 'border-blue-300',    badge: 'bg-blue-100 text-blue-700',     label: 'Occupied' },
  EXPIRING_SOON:{ bg: 'bg-orange-50 hover:bg-orange-100',border: 'border-orange-300',  badge: 'bg-orange-100 text-orange-700', label: 'Expiring' },
  INACTIVE:     { bg: 'bg-gray-100 hover:bg-gray-150',   border: 'border-gray-300',    badge: 'bg-gray-200 text-gray-500',     label: 'Inactive' },
};

const LOCKER_STATUS_STYLES: Record<LockerStatus, { bg: string; border: string; badge: string; label: string }> = {
  VACANT:   { bg: 'bg-green-50 hover:bg-green-100', border: 'border-green-300', badge: 'bg-green-100 text-green-700', label: 'Vacant' },
  OCCUPIED: { bg: 'bg-blue-50 hover:bg-blue-100',   border: 'border-blue-300',  badge: 'bg-blue-100 text-blue-700',  label: 'Occupied' },
};

type FilterStatus = 'ALL' | CabinStatus;

function AddCabinModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [cabinNo, setCabinNo] = useState('');
  const [roomName, setRoomName] = useState('');
  const [category, setCategory] = useState('RRR 1.0');
  const [cabinType, setCabinType] = useState('STANDARD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!cabinNo.trim()) { setError('Cabin number is required'); return; }
    if (!roomName.trim()) { setError('Room name is required'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/cabins', { cabinNo: cabinNo.trim(), roomName: roomName.trim(), category, cabinType });
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add cabin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Add New Cabin</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400"><X className="h-4 w-4" /></button>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Cabin No *</label>
            <input type="text" placeholder="e.g. A5, K26" value={cabinNo} onChange={(e) => setCabinNo(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Room Name *</label>
            <input type="text" placeholder="e.g. General, Elite" value={roomName} onChange={(e) => setRoomName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="RRR 1.0">RRR 1.0</option>
              <option value="RRR 2.0">RRR 2.0</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Cabin Type</label>
            <select value={cabinType} onChange={(e) => setCabinType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="STANDARD">Standard</option>
              <option value="PREMIUM">Premium</option>
              <option value="AC">AC</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Add Cabin
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddLockerModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [lockerNo, setLockerNo] = useState('');
  const [area, setArea] = useState('General Locker');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!lockerNo.trim()) { setError('Locker number is required'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/lockers', { lockerNo: lockerNo.trim(), area });
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add locker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Add New Locker</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400"><X className="h-4 w-4" /></button>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Locker Number *</label>
            <input type="text" placeholder="e.g. L21, B-5" value={lockerNo} onChange={(e) => setLockerNo(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Area</label>
            <select value={area} onChange={(e) => setArea(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="General Locker">General Locker</option>
              <option value="Elite Locker">Elite Locker</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Add Locker
          </Button>
        </div>
      </div>
    </div>
  );
}

interface AssignModalProps {
  cabin: Cabin;
  onClose: () => void;
  onAssigned: () => void;
}

function AssignCabinModal({ cabin, onClose, onAssigned }: AssignModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ students: Student[] }>('/students?status=ACTIVE&limit=100').then((d) => setStudents(d.students));
  }, []);

  const handleAssign = async () => {
    if (!selectedStudentId || !startDate || !endDate) { setError('Please fill all required fields'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post(`/students/${selectedStudentId}/memberships`, {
        startDate, endDate, cabinId: cabin.id, paymentStatus,
      });
      onAssigned();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to assign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Assign Cabin {cabin.cabinNo}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400"><X className="h-4 w-4" /></button>
        </div>

        <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-800">{cabin.roomName} <span className="text-indigo-500 font-normal">· {cabin.category}</span></p>
            <p className="text-xs text-indigo-500 mt-0.5">{cabin.cabinType}</p>
          </div>
          {cabin.monthlyPrice ? (
            <div className="text-right">
              <p className="text-lg font-bold text-indigo-700">₹{Number(cabin.monthlyPrice).toLocaleString('en-IN')}</p>
              <p className="text-xs text-indigo-400">per month</p>
            </div>
          ) : null}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Student *</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select a student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.studentCode}) — {s.phone}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Start Date *</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">End Date *</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAssign} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Assign Cabin
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CabinsPage() {
  const navigate = useNavigate();
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [activeTab, setActiveTab] = useState<'cabins' | 'lockers'>('cabins');
  const [assignCabin, setAssignCabin] = useState<Cabin | null>(null);
  const [releasing, setReleasing] = useState<string | null>(null);
  const [showAddCabin, setShowAddCabin] = useState(false);
  const [showAddLocker, setShowAddLocker] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cabinRes, lockerRes] = await Promise.all([
        api.get<{ cabins: Cabin[] }>('/cabins'),
        api.get<{ lockers: Locker[] }>('/lockers'),
      ]);
      setCabins(cabinRes.cabins);
      setLockers(lockerRes.lockers);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleReleaseCabin = async (cabin: Cabin) => {
    if (!confirm(`Release cabin ${cabin.cabinNo}? The student will be unassigned.`)) return;
    setReleasing(cabin.id);
    try {
      await api.post(`/cabins/${cabin.id}/release`, {});
      await fetchAll();
    } finally {
      setReleasing(null);
    }
  };

  const handleReleaseLocker = async (locker: Locker) => {
    if (!confirm(`Release locker ${locker.lockerNo}?`)) return;
    setReleasing(locker.id);
    try {
      await api.post(`/lockers/${locker.id}/release`, {});
      await fetchAll();
    } finally {
      setReleasing(null);
    }
  };

  const filteredCabins = filterStatus === 'ALL' ? cabins : cabins.filter((c) => c.status === filterStatus);

  const groupedByCategory = filteredCabins.reduce<Record<string, Record<string, Cabin[]>>>((acc, cabin) => {
    if (!acc[cabin.category]) acc[cabin.category] = {};
    if (!acc[cabin.category][cabin.roomName]) acc[cabin.category][cabin.roomName] = [];
    acc[cabin.category][cabin.roomName].push(cabin);
    return acc;
  }, {});

  const cabinSummary = {
    total: cabins.length,
    vacant: cabins.filter((c) => c.status === 'VACANT').length,
    occupied: cabins.filter((c) => c.status === 'OCCUPIED').length,
    expiring: cabins.filter((c) => c.status === 'EXPIRING_SOON').length,
    inactive: cabins.filter((c) => c.status === 'INACTIVE').length,
  };

  const lockerSummary = {
    total: lockers.length,
    vacant: lockers.filter((l) => l.status === 'VACANT').length,
    occupied: lockers.filter((l) => l.status === 'OCCUPIED').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cabins & Lockers</h1>
          <p className="text-sm text-gray-500">Visual overview of all seats and lockers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          {activeTab === 'cabins' ? (
            <Button size="sm" onClick={() => setShowAddCabin(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Cabin
            </Button>
          ) : (
            <Button size="sm" onClick={() => setShowAddLocker(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Locker
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Vacant', count: cabinSummary.vacant, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Occupied', count: cabinSummary.occupied, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Expiring Soon', count: cabinSummary.expiring, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Inactive', count: cabinSummary.inactive, color: 'text-gray-500', bg: 'bg-gray-100' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={cn('rounded-xl border border-gray-200 p-4 text-center', bg)}>
            <p className={cn('text-2xl font-bold', color)}>{count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit gap-1">
        {(['cabins', 'lockers'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize',
              activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab === 'cabins' ? <DoorOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {tab === 'cabins' ? `Cabins (${cabinSummary.total})` : `Lockers (${lockerSummary.total})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : activeTab === 'cabins' ? (
        <>
          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'VACANT', 'OCCUPIED', 'EXPIRING_SOON', 'INACTIVE'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  filterStatus === s
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                )}
              >
                {s === 'ALL' ? 'All Cabins' : s === 'EXPIRING_SOON' ? 'Expiring Soon' : s.charAt(0) + s.slice(1).toLowerCase()}
                {s !== 'ALL' && ` (${cabins.filter((c) => c.status === s).length})`}
              </button>
            ))}
          </div>

          {/* Cabin Grid grouped by Category → Room Name */}
          <div className="space-y-8">
            {Object.entries(groupedByCategory).map(([cat, rooms]) => (
              <div key={cat}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-white bg-primary px-3 py-1 rounded-full">{cat}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="space-y-5">
                  {Object.entries(rooms).map(([roomName, roomCabins]) => (
                    <div key={roomName}>
                      <p className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                        <DoorOpen className="h-4 w-4 text-gray-400" /> {roomName}
                        <span className="text-xs font-normal text-gray-400">({roomCabins.length} cabins)</span>
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {roomCabins.map((cabin) => {
                          const style = CABIN_STATUS_STYLES[cabin.status];
                          const m = cabin.activeMembership;
                          const daysLeft = m ? Math.ceil((new Date(m.endDate).getTime() - Date.now()) / 86400000) : null;
                          return (
                            <div
                              key={cabin.id}
                              className={cn('relative rounded-xl border-2 p-3 cursor-pointer transition-all duration-150 space-y-2', style.bg, style.border)}
                              onClick={() => cabin.status !== 'INACTIVE' && setAssignCabin(cabin)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900 text-sm">{cabin.cabinNo}</span>
                                <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', style.badge)}>
                                  {style.label}
                                </span>
                              </div>
                              {cabin.monthlyPrice ? (
                                <div className="text-xs font-semibold text-indigo-600">₹{Number(cabin.monthlyPrice).toLocaleString('en-IN')}<span className="font-normal text-gray-400">/mo</span></div>
                              ) : null}
                              {m ? (
                                <div className="space-y-1 pt-1 border-t border-current/10">
                                  <div className="flex items-center gap-1 text-xs text-gray-700 font-medium truncate">
                                    <User className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{m.student.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs">
                                    <Calendar className="h-3 w-3 shrink-0 text-gray-400" />
                                    <span className={cn('font-medium text-xs', daysLeft !== null && daysLeft <= 7 ? 'text-red-600' : daysLeft !== null && daysLeft <= 30 ? 'text-orange-600' : 'text-green-600')}>
                                      {daysLeft !== null ? (daysLeft < 0 ? `Exp ${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`) : ''}
                                    </span>
                                  </div>
                                  <div className="flex gap-1 mt-1">
                                    <button onClick={(e) => { e.stopPropagation(); handleReleaseCabin(cabin); }} disabled={releasing === cabin.id}
                                      className="flex-1 text-xs text-red-500 hover:bg-red-50 rounded px-1 py-1 transition-colors">
                                      {releasing === cabin.id ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : 'Release'}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setAssignCabin(cabin); }} disabled={releasing === cabin.id}
                                      className="flex-1 text-xs text-blue-500 hover:bg-blue-50 rounded px-1 py-1 transition-colors">
                                      Reassign
                                    </button>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); navigate(`/students/${m.student.id}`); }}
                                    className="w-full text-xs text-primary hover:underline truncate">
                                    View →
                                  </button>
                                </div>
                              ) : cabin.status === 'VACANT' ? (
                                <button onClick={(e) => { e.stopPropagation(); setAssignCabin(cabin); }}
                                  className="w-full flex items-center justify-center gap-1 text-xs text-green-700 hover:bg-green-200 rounded px-2 py-1.5 transition-colors">
                                  <Plus className="h-3 w-3" /> Assign
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Locker Grid grouped by Area */
        <>
          <div className="flex gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-400 inline-block" /> Vacant ({lockerSummary.vacant})</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-blue-400 inline-block" /> Occupied ({lockerSummary.occupied})</span>
          </div>

          <div className="space-y-8">
            {Object.entries(
              lockers.reduce<Record<string, Locker[]>>((acc, l) => {
                const area = l.area || 'Other';
                if (!acc[area]) acc[area] = [];
                acc[area].push(l);
                return acc;
              }, {})
            ).map(([area, areaLockers]) => (
              <div key={area}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-white bg-gray-700 px-3 py-1 rounded-full">{area}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">{areaLockers.filter(l => l.status === 'VACANT').length} vacant / {areaLockers.length} total</span>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                  {areaLockers.map((locker) => {
                    const style = LOCKER_STATUS_STYLES[locker.status];
                    return (
                      <div key={locker.id} className={cn('rounded-xl border-2 p-3 space-y-2 transition-all', style.bg, style.border)}>
                        <div className="flex items-center gap-1">
                          <Lock className="h-3.5 w-3.5 text-gray-500" />
                          <span className="font-bold text-gray-900 text-sm">{locker.lockerNo}</span>
                        </div>
                        <span className={cn('inline-block text-xs px-2 py-0.5 rounded-full font-medium', style.badge)}>
                          {style.label}
                        </span>
                        {locker.currentStudent ? (
                          <div className="space-y-1 border-t border-current/10 pt-1">
                            <div className="flex items-center gap-1 text-xs text-gray-700 truncate">
                              <User className="h-3 w-3 shrink-0" />
                              <span className="truncate font-medium">{locker.currentStudent.name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{locker.currentStudent.phone}</span>
                            </div>
                            <button onClick={() => handleReleaseLocker(locker)} disabled={releasing === locker.id}
                              className="mt-1 w-full text-xs text-red-500 hover:bg-red-50 rounded px-2 py-1 transition-colors">
                              {releasing === locker.id ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : 'Release'}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {assignCabin && (
        <AssignCabinModal
          cabin={assignCabin}
          onClose={() => setAssignCabin(null)}
          onAssigned={() => { setAssignCabin(null); fetchAll(); }}
        />
      )}
      {showAddCabin && (
        <AddCabinModal
          onClose={() => setShowAddCabin(false)}
          onAdded={() => { setShowAddCabin(false); fetchAll(); }}
        />
      )}
      {showAddLocker && (
        <AddLockerModal
          onClose={() => setShowAddLocker(false)}
          onAdded={() => { setShowAddLocker(false); fetchAll(); }}
        />
      )}
    </div>
  );
}
