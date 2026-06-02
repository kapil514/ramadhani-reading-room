import { useEffect, useState } from 'react';
import {
  Loader2, Users, IndianRupee, TrendingUp, TrendingDown,
  DoorOpen, AlertTriangle, Clock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE';

interface ReportData {
  students: { total: number; active: number; newThisMonth: number };
  revenue: { total: number; thisMonth: number; lastMonth: number };
  pendingPayments: number;
  expiringMemberships: {
    id: string; startDate: string; endDate: string; paymentStatus: string;
    student: { id: string; name: string; studentCode: string; phone: string };
    cabin?: { cabinNo: string; roomName: string } | null;
  }[];
  cabins: { vacant: number; occupied: number };
  byMode: { paymentMode: PaymentMode; _sum: { amount: string }; _count: number }[];
  monthlyTrend: { month: string; revenue: number; count: number }[];
  genderBreakdown: { gender: string | null; _count: number }[];
  courseBreakdown: { course: string | null; _count: number }[];
  referralBreakdown: { referralSource: string | null; _count: number }[];
}

const MODE_LABELS: Record<PaymentMode, string> = {
  CASH: 'Cash', UPI: 'UPI', CARD: 'Card', BANK_TRANSFER: 'Bank Transfer', CHEQUE: 'Cheque',
};

function KpiCard({ icon: Icon, label, value, sub, color = 'text-gray-900', trend }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color?: string; trend?: 'up' | 'down' | null;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">{label}</p>
          <p className={cn('text-3xl font-bold', color)}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <Icon className="h-5 w-5 text-gray-500" />
        </div>
      </div>
      {trend && (
        <div className={cn('flex items-center gap-1 mt-3 text-xs font-medium', trend === 'up' ? 'text-green-600' : 'text-red-500')}>
          {trend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {trend === 'up' ? 'More than last month' : 'Less than last month'}
        </div>
      )}
    </div>
  );
}

function SimpleBar({ label, value, max, color = 'bg-primary' }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-36 truncate shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={cn('h-2.5 rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-8 text-right">{value}</span>
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ReportData>('/reports/dashboard').then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading || !data) {
    return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  const revTrend = data.revenue.thisMonth >= data.revenue.lastMonth ? 'up' : 'down';
  const maxCourse = Math.max(...data.courseBreakdown.map((c) => c._count), 1);
  const maxReferral = Math.max(...data.referralBreakdown.map((r) => r._count), 1);
  const maxMode = Math.max(...data.byMode.map((m) => Number(m._sum.amount ?? 0)), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500">Overview of students, revenue, and occupancy</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard icon={Users} label="Total Students" value={data.students.total}
          sub={`${data.students.active} active`} />
        <KpiCard icon={Users} label="New This Month" value={data.students.newThisMonth}
          color="text-blue-700" />
        <KpiCard icon={IndianRupee} label="This Month Revenue"
          value={`₹${data.revenue.thisMonth.toLocaleString('en-IN')}`}
          sub={`Last month: ₹${data.revenue.lastMonth.toLocaleString('en-IN')}`}
          color="text-green-700" trend={revTrend} />
        <KpiCard icon={IndianRupee} label="Total Revenue"
          value={`₹${data.revenue.total.toLocaleString('en-IN')}`}
          color="text-gray-900" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard icon={AlertTriangle} label="Pending Payments" value={data.pendingPayments}
          color={data.pendingPayments > 0 ? 'text-red-600' : 'text-gray-900'} />
        <KpiCard icon={Clock} label="Expiring (30 days)" value={data.expiringMemberships.length}
          color={data.expiringMemberships.length > 0 ? 'text-orange-600' : 'text-gray-900'} />
        <KpiCard icon={DoorOpen} label="Vacant Cabins" value={data.cabins.vacant}
          color="text-green-700" />
        <KpiCard icon={DoorOpen} label="Occupied Cabins" value={data.cabins.occupied}
          color="text-blue-700" />
      </div>

      {/* Monthly Trend */}
      {data.monthlyTrend.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Monthly Revenue Trend</h2>
          <div className="flex items-end gap-2 h-40">
            {data.monthlyTrend.map((m) => {
              const maxRev = Math.max(...data.monthlyTrend.map((x) => x.revenue), 1);
              const height = Math.max(4, (m.revenue / maxRev) * 100);
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 font-medium">₹{(m.revenue / 1000).toFixed(0)}k</span>
                  <div className="w-full bg-primary/80 hover:bg-primary rounded-t transition-colors" style={{ height: `${height}%` }} title={`₹${m.revenue.toLocaleString('en-IN')} (${m.count} payments)`} />
                  <span className="text-xs text-gray-400 text-center leading-tight">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Payment by Mode */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Revenue by Payment Mode</h2>
          {data.byMode.map((m) => (
            <SimpleBar
              key={m.paymentMode}
              label={MODE_LABELS[m.paymentMode] ?? m.paymentMode}
              value={Number(m._sum.amount ?? 0)}
              max={maxMode}
              color="bg-blue-500"
            />
          ))}
          {data.byMode.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
        </div>

        {/* Gender Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Gender Breakdown</h2>
          <div className="flex gap-4">
            {data.genderBreakdown.map((g) => {
              const label = g.gender ?? 'Not specified';
              const color = g.gender === 'MALE' ? 'bg-blue-500' : g.gender === 'FEMALE' ? 'bg-pink-400' : 'bg-gray-400';
              return (
                <div key={label} className="flex items-center gap-2">
                  <span className={cn('h-3 w-3 rounded-full', color)} />
                  <span className="text-sm text-gray-700 font-medium">{g._count}</span>
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Course Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Top Courses</h2>
          {data.courseBreakdown.map((c) => (
            <SimpleBar key={c.course ?? 'N/A'} label={c.course ?? 'Not specified'} value={c._count} max={maxCourse} color="bg-purple-400" />
          ))}
          {data.courseBreakdown.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
        </div>

        {/* Referral Source */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Referral Sources</h2>
          {data.referralBreakdown.map((r) => (
            <SimpleBar key={r.referralSource ?? 'Unknown'} label={r.referralSource ?? 'Not specified'} value={r._count} max={maxReferral} color="bg-orange-400" />
          ))}
          {data.referralBreakdown.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
        </div>
      </div>

      {/* Expiring Memberships */}
      {data.expiringMemberships.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-orange-800 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Memberships Expiring in 30 Days
          </h2>
          <div className="divide-y divide-orange-100">
            {data.expiringMemberships.map((m) => {
              const daysLeft = Math.ceil((new Date(m.endDate).getTime() - Date.now()) / 86400000);
              return (
                <div key={m.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <span className="font-medium text-gray-800">{m.student.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{m.student.studentCode} · {m.student.phone}</span>
                    {m.cabin && <span className="ml-2 text-xs text-blue-600">Cabin {m.cabin.cabinNo}</span>}
                  </div>
                  <div className="text-right">
                    <span className={cn('text-xs font-bold', daysLeft <= 7 ? 'text-red-600' : 'text-orange-600')}>
                      {daysLeft}d left
                    </span>
                    <div className="text-xs text-gray-400">{new Date(m.endDate).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
