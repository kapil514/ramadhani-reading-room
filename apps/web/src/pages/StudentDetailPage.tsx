import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Pencil, Phone, Mail, MapPin,
  BookOpen, CreditCard, DoorOpen, Calendar, BadgeCheck, Fingerprint,
  Users, Clock, Info, Building2,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Student, StudentStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<StudentStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  LEFT: 'bg-gray-100 text-gray-600',
};

const PAYMENT_STYLES: Record<string, string> = {
  PAID: 'text-green-600',
  PARTIAL: 'text-yellow-600',
  PENDING: 'text-red-600',
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get<{ student: Student }>(`/students/${id}`)
      .then(({ student }) => setStudent(student))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>Student not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/students')}>Back</Button>
      </div>
    );
  }

  const latestMembership = student.memberships?.[0];
  const daysLeft = latestMembership
    ? Math.ceil((new Date(latestMembership.endDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/students')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">{student.studentCode}</span>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_STYLES[student.status])}>
                {student.status}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/students/${student.id}/edit`)}>
          <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Contact & Personal */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm">Personal Details</h2>
          <div className="space-y-3">
            <InfoRow icon={Users} label="Gender" value={student.gender} />
            <InfoRow icon={Calendar} label="Date of Birth" value={student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : null} />
            <InfoRow icon={Phone} label="Phone" value={student.phone} />
            <InfoRow icon={Phone} label="Alternate Phone" value={student.alternatePhone} />
            <InfoRow icon={Mail} label="Email" value={student.email} />
            <InfoRow icon={MapPin} label="Address" value={student.address} />
            <InfoRow icon={Fingerprint} label="Fingerprint ID" value={student.fingerprintId} />
          </div>
        </div>

        {/* Govt ID */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm">Academic Details</h2>
          <div className="space-y-3">
            <InfoRow icon={BookOpen} label="Course / Exam" value={student.course} />
            <InfoRow icon={BookOpen} label="Year / Level" value={student.studyLevel} />
            <InfoRow icon={Building2} label="Institution" value={student.institution} />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm">Study Preferences</h2>
          <div className="space-y-3">
            <InfoRow icon={Clock} label="Daily Study Hours" value={student.studyHoursPerDay} />
            <InfoRow icon={Clock} label="Preferred Time" value={student.preferredStudyTime} />
            <InfoRow icon={Info} label="Referred By" value={student.referralSource} />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm">Government ID</h2>
          <div className="space-y-3">
            <InfoRow icon={BadgeCheck} label="ID Type" value={student.govtIdType?.replace('_', ' ')} />
            <InfoRow icon={BadgeCheck} label="ID Number" value={student.govtIdNumber} />
          </div>
          <div className="pt-2">
            <p className="text-xs text-gray-400">Registered on</p>
            <p className="text-sm text-gray-700">{new Date(student.createdAt).toLocaleDateString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Membership History */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm">Membership History</h2>
        {!student.memberships || student.memberships.length === 0 ? (
          <p className="text-sm text-gray-400">No membership records yet.</p>
        ) : (
          <div className="space-y-3">
            {student.memberships.map((m, i) => {
              const days = Math.ceil((new Date(m.endDate).getTime() - Date.now()) / 86400000);
              return (
                <div
                  key={m.id}
                  className={cn(
                    'rounded-lg border p-4 space-y-2',
                    i === 0 ? 'border-primary/30 bg-primary/5' : 'border-gray-100 bg-gray-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-800">
                        {new Date(m.startDate).toLocaleDateString('en-IN')} → {new Date(m.endDate).toLocaleDateString('en-IN')}
                      </span>
                      {i === 0 && <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">Current</span>}
                    </div>
                    <span className={cn('text-xs font-semibold', PAYMENT_STYLES[m.paymentStatus])}>
                      {m.paymentStatus}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {m.cabin && (
                      <span className="flex items-center gap-1">
                        <DoorOpen className="h-3 w-3" /> Cabin {m.cabin.cabinNo}
                        {m.cabin.roomName && <span className="text-gray-400">· {m.cabin.roomName}</span>}
                        {m.cabin.category && <span className="text-gray-400">· {m.cabin.category}</span>}
                      </span>
                    )}
                    {m.locker && (
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" /> Locker {m.locker.lockerNo}
                      </span>
                    )}
                    {i === 0 && daysLeft !== null && (
                      <span className={cn('font-medium', days < 0 ? 'text-red-500' : days <= 7 ? 'text-orange-500' : 'text-green-600')}>
                        {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days} days left`}
                      </span>
                    )}
                  </div>
                  {(m.amountDue != null || m.cabin?.monthlyPrice != null) && (
                    <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                      <span className="text-xs text-gray-500">Monthly Rate:</span>
                      <span className="text-sm font-bold text-indigo-700">
                        ₹{Number(m.cabin?.monthlyPrice ?? m.amountDue ?? 0).toLocaleString('en-IN')}
                      </span>
                      {m.amountDue != null && (
                        <span className="text-xs text-gray-500 ml-2">Due: <span className="font-semibold text-gray-800">₹{Number(m.amountDue).toLocaleString('en-IN')}</span></span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
