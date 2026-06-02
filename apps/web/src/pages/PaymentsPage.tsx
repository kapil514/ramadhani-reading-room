import { useEffect, useState, useCallback } from 'react';
import { IndianRupee, Plus, Loader2, X, Search, CreditCard, Banknote, Smartphone, Building2, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE';

interface Payment {
  id: string;
  invoiceNumber: string;
  amount: string;
  paidAt: string;
  paymentMode: PaymentMode;
  txnReference?: string | null;
  notes?: string | null;
  student: { id: string; name: string; studentCode: string; phone: string };
  membership: {
    id: string;
    startDate: string;
    endDate: string;
    paymentStatus: string;
    cabin?: { cabinNo: string; roomName: string } | null;
  };
}

interface MembershipOption {
  id: string;
  startDate: string;
  endDate: string;
  paymentStatus: string;
  amountDue?: number | null;
  cabin?: { id: string; cabinNo: string; roomName: string; category: string; monthlyPrice?: number | null } | null;
  student: { id: string; name: string; studentCode: string; phone: string };
}

const MODE_LABELS: Record<PaymentMode, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
};

const MODE_ICONS: Record<PaymentMode, React.ElementType> = {
  CASH: Banknote,
  UPI: Smartphone,
  CARD: CreditCard,
  BANK_TRANSFER: Building2,
  CHEQUE: FileText,
};

const MODE_COLORS: Record<PaymentMode, string> = {
  CASH: 'bg-green-100 text-green-700',
  UPI: 'bg-purple-100 text-purple-700',
  CARD: 'bg-blue-100 text-blue-700',
  BANK_TRANSFER: 'bg-orange-100 text-orange-700',
  CHEQUE: 'bg-gray-100 text-gray-700',
};

const sel = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function RecordPaymentModal({ onClose, onRecorded }: { onClose: () => void; onRecorded: () => void }) {
  const [search, setSearch] = useState('');
  const [memberships, setMemberships] = useState<MembershipOption[]>([]);
  const [selectedMembership, setSelectedMembership] = useState<MembershipOption | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [txnReference, setTxnReference] = useState('');
  const [notes, setNotes] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const searchMemberships = useCallback(async (q: string) => {
    if (!q.trim()) { setMemberships([]); return; }
    setSearching(true);
    try {
      const res = await api.get<{ students: { id: string; name: string; studentCode: string; phone: string; memberships?: MembershipOption[] }[] }>(
        `/students?search=${encodeURIComponent(q)}&limit=10`
      );
      const opts: MembershipOption[] = [];
      for (const s of res.students) {
        for (const m of s.memberships ?? []) {
          opts.push({ ...m, student: { id: s.id, name: s.name, studentCode: s.studentCode, phone: s.phone } });
        }
      }
      setMemberships(opts);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchMemberships(search), 300);
    return () => clearTimeout(t);
  }, [search, searchMemberships]);

  // When a membership is selected, pre-fill amount from amountDue or cabin monthlyPrice
  const suggestedAmount = selectedMembership
    ? Number(selectedMembership.amountDue ?? selectedMembership.cabin?.monthlyPrice ?? 0)
    : 0;

  const handleSubmit = async () => {
    if (!selectedMembership) { setError('Select a student membership'); return; }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { setError('Enter a valid amount'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/payments', {
        membershipId: selectedMembership.id,
        studentId: selectedMembership.student.id,
        amount: Number(amount),
        paidAt,
        paymentMode,
        txnReference: txnReference || null,
        notes: notes || null,
      });
      onRecorded();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Record Payment</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400"><X className="h-4 w-4" /></button>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Search Student *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Name, phone or student code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
            </div>
            {memberships.length > 0 && !selectedMembership && (
              <div className="border rounded-md max-h-48 overflow-y-auto divide-y text-sm shadow-sm">
                {memberships.map((m) => (
                  <button key={m.id} onClick={() => { setSelectedMembership(m); setSearch(m.student.name); setMemberships([]); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50">
                    <span className="font-medium">{m.student.name}</span>
                    <span className="text-gray-400 ml-1">({m.student.studentCode})</span>
                    {m.cabin && <span className="ml-2 text-xs text-blue-600">Cabin {m.cabin.cabinNo}</span>}
                    <span className={cn('ml-2 text-xs px-1.5 py-0.5 rounded-full', m.paymentStatus === 'PENDING' ? 'bg-red-100 text-red-700' : m.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700')}>
                      {m.paymentStatus}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {selectedMembership && (
              <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-blue-800">{selectedMembership.student.name}</span>
                    <span className="text-blue-600 ml-1">({selectedMembership.student.studentCode})</span>
                    {selectedMembership.cabin && (
                      <span className="ml-2 text-xs text-gray-600">· Cabin {selectedMembership.cabin.cabinNo} — {selectedMembership.cabin.roomName} ({selectedMembership.cabin.category})</span>
                    )}
                  </div>
                  <button onClick={() => { setSelectedMembership(null); setSearch(''); setAmount(''); }} className="text-blue-400 hover:text-blue-600"><X className="h-4 w-4" /></button>
                </div>
                <div className="text-xs text-blue-600">{new Date(selectedMembership.startDate).toLocaleDateString('en-IN')} → {new Date(selectedMembership.endDate).toLocaleDateString('en-IN')}</div>
                {suggestedAmount > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-gray-500">Monthly rate:</span>
                    <span className="text-sm font-bold text-indigo-700">₹{suggestedAmount.toLocaleString('en-IN')}</span>
                    {!amount && (
                      <button type="button" onClick={() => setAmount(String(suggestedAmount))}
                        className="text-xs text-indigo-600 underline hover:text-indigo-800">Use this amount</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Amount (₹) *</label>
              <Input type="number" min="1" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Payment Mode</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {(Object.keys(MODE_LABELS) as PaymentMode[]).map((mode) => {
                const Icon = MODE_ICONS[mode];
                return (
                  <button key={mode} type="button" onClick={() => setPaymentMode(mode)}
                    className={cn('flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-xs font-medium transition-colors',
                      paymentMode === mode ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    )}>
                    <Icon className="h-4 w-4" />
                    {MODE_LABELS[mode]}
                  </button>
                );
              })}
            </div>
          </div>

          {(paymentMode === 'UPI' || paymentMode === 'CARD' || paymentMode === 'BANK_TRANSFER' || paymentMode === 'CHEQUE') && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Transaction Reference</label>
              <Input placeholder="UTR / Cheque no. / Ref. ID" value={txnReference} onChange={(e) => setTxnReference(e.target.value)} />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea rows={2} placeholder="Any remarks…" value={notes} onChange={(e) => setNotes(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <IndianRupee className="h-4 w-4 mr-2" />}
            Record Payment
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showRecord, setShowRecord] = useState(false);
  const limit = 20;

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      const res = await api.get<{ payments: Payment[]; total: number }>(`/payments?${params}`);
      setPayments(res.payments);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const totalPages = Math.ceil(total / limit);

  const totalAmount = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500">Record and track all membership payments</p>
        </div>
        <Button onClick={() => setShowRecord(true)}>
          <Plus className="h-4 w-4 mr-2" /> Record Payment
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Payments', value: total, color: 'text-gray-800', bg: 'bg-gray-50' },
          { label: 'Shown Total', value: `₹${totalAmount.toLocaleString('en-IN')}`, color: 'text-green-700', bg: 'bg-green-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('rounded-xl border border-gray-200 p-4', bg)}>
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
          <IndianRupee className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No payments recorded yet</p>
          <p className="text-sm">Click "Record Payment" to get started</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Invoice', 'Student', 'Cabin', 'Amount', 'Mode', 'Date', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => {
                  const Icon = MODE_ICONS[p.paymentMode];
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.invoiceNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{p.student.name}</div>
                        <div className="text-xs text-gray-400">{p.student.studentCode} · {p.student.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {p.membership.cabin ? `${p.membership.cabin.cabinNo} — ${p.membership.cabin.roomName}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium', MODE_COLORS[p.paymentMode])}>
                          <Icon className="h-3 w-3" /> {MODE_LABELS[p.paymentMode]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                        {new Date(p.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs px-2 py-1 rounded-full font-medium',
                          p.membership.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700'
                          : p.membership.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700')}>
                          {p.membership.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {showRecord && (
        <RecordPaymentModal
          onClose={() => setShowRecord(false)}
          onRecorded={() => { setShowRecord(false); fetchPayments(); }}
        />
      )}
    </div>
  );
}
