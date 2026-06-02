import { useEffect, useState } from 'react';
import { Users, UserPlus, DoorOpen, TrendingUp, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface Stats {
  activeStudents: number;
  followUpLeads: number;
  expiringStudents: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ total: number }>('/students?status=ACTIVE&limit=1'),
      api.get<{ total: number }>('/enquiries?status=FOLLOW_UP&limit=1'),
      api.get<{ cabins: { status: string }[] }>('/cabins'),
    ]).then(([activeRes, followRes, cabinRes]) => {
      setStats({
        activeStudents: activeRes.total,
        followUpLeads: followRes.total,
        expiringStudents: cabinRes.cabins.filter((c) => c.status === 'VACANT').length,
      });
    });
  }, []);

  const kpiCards = [
    { label: 'Active Students', value: stats?.activeStudents ?? '—', icon: Users, color: 'bg-blue-50 text-blue-600', to: '/students?status=ACTIVE' },
    { label: 'Follow-up Leads', value: stats?.followUpLeads ?? '—', icon: UserPlus, color: 'bg-yellow-50 text-yellow-600', to: '/enquiries' },
    { label: 'Vacant Cabins', value: stats?.expiringStudents ?? '—', icon: DoorOpen, color: 'bg-green-50 text-green-600', to: '/cabins' },
    { label: 'Monthly Revenue', value: '—', icon: TrendingUp, color: 'bg-purple-50 text-purple-600', to: '/reports' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back, {user?.name}!</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map(({ label, value, icon: Icon, color, to }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow text-left w-full"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color} shrink-0`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              {stats === null ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              )}
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-700 mb-4">Quick Actions</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/enquiries/new')} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
            + New Enquiry
          </button>
          <button onClick={() => navigate('/students/new')} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
            + Register Student
          </button>
          <button onClick={() => navigate('/students')} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
            View All Students
          </button>
        </div>
      </div>
    </div>
  );
}
