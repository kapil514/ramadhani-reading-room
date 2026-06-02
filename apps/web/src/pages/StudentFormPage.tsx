import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, UserPlus, BookOpen, CreditCard, Building2, Clock, Info } from 'lucide-react';
import { api } from '@/lib/api';
import type { Student, Cabin, Locker } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const sel = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', '']).optional(),
  phone: z.string().min(10, 'Enter a valid phone number'),
  alternatePhone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  dob: z.string().optional(),
  address: z.string().optional(),
  course: z.string().optional(),
  institution: z.string().optional(),
  studyLevel: z.string().optional(),
  studyHoursPerDay: z.string().optional(),
  preferredStudyTime: z.string().optional(),
  referralSource: z.string().optional(),
  govtIdType: z.enum(['AADHAAR', 'PAN', 'DRIVING_LICENCE', 'PASSPORT', '']).optional(),
  govtIdNumber: z.string().optional(),
  fingerprintId: z.string().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'PAUSED', 'LEFT']).default('ACTIVE'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  cabinId: z.string().optional(),
  lockerId: z.string().optional(),
  paymentStatus: z.enum(['PAID', 'PARTIAL', 'PENDING']).default('PENDING'),
});

type FormData = z.infer<typeof schema>;

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function StudentFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [serverError, setServerError] = useState('');
  const [loadingData, setLoadingData] = useState(isEdit);
  const [vacantCabins, setVacantCabins] = useState<Cabin[]>([]);
  const [vacantLockers, setVacantLockers] = useState<Locker[]>([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'ACTIVE', paymentStatus: 'PENDING', startDate: new Date().toISOString().split('T')[0] },
  });

  useEffect(() => {
    if (!isEdit) {
      Promise.all([
        api.get<{ cabins: Cabin[] }>('/cabins'),
        api.get<{ lockers: Locker[] }>('/lockers'),
      ]).then(([cabinRes, lockerRes]) => {
        setVacantCabins(cabinRes.cabins.filter((c) => c.status === 'VACANT'));
        setVacantLockers(lockerRes.lockers.filter((l) => l.status === 'VACANT'));
      });
    }
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit || !id) return;
    api.get<{ student: Student }>(`/students/${id}`).then(({ student }) => {
      const m = student.memberships?.[0];
      reset({
        name: student.name,
        gender: (student.gender as FormData['gender']) ?? '',
        phone: student.phone,
        alternatePhone: student.alternatePhone ?? '',
        email: student.email ?? '',
        dob: student.dob?.split('T')[0] ?? '',
        address: student.address ?? '',
        course: student.course ?? '',
        institution: student.institution ?? '',
        studyLevel: student.studyLevel ?? '',
        studyHoursPerDay: student.studyHoursPerDay ?? '',
        preferredStudyTime: student.preferredStudyTime ?? '',
        referralSource: student.referralSource ?? '',
        govtIdType: (student.govtIdType as FormData['govtIdType']) ?? '',
        govtIdNumber: student.govtIdNumber ?? '',
        fingerprintId: student.fingerprintId ?? '',
        status: student.status,
        startDate: m?.startDate?.split('T')[0] ?? '',
        endDate: m?.endDate?.split('T')[0] ?? '',
        paymentStatus: m?.paymentStatus ?? 'PENDING',
      });
      setLoadingData(false);
    });
  }, [id, isEdit, reset]);

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const { startDate, endDate, paymentStatus, cabinId, lockerId, govtIdType, gender, email, ...rest } = data;
      const studentPayload = {
        ...rest,
        email: email || null,
        gender: gender || null,
        govtIdType: govtIdType || null,
      };

      let studentId = id;
      if (isEdit && id) {
        await api.put(`/students/${id}`, studentPayload);
      } else {
        const res = await api.post<{ student: Student }>('/students', studentPayload);
        studentId = res.student.id;
      }

      if (!isEdit && startDate && endDate && studentId) {
        await api.post(`/students/${studentId}/memberships`, {
          startDate, endDate, paymentStatus,
          cabinId: cabinId || null,
          lockerId: lockerId || null,
        });
      }

      navigate('/students');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  if (loadingData) {
    return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/students')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Student' : 'Student Admission Form'}</h1>
          <p className="text-sm text-gray-500">{isEdit ? 'Update student details' : 'Ramadhani Reading Room — New Registration'}</p>
        </div>
      </div>

      {serverError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{serverError}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* 1. Personal Details */}
        <Section icon={UserPlus} title="Personal Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Student Full Name *</Label>
              <Input id="name" placeholder="As per government ID" {...register('name')} />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <select id="gender" className={sel} {...register('gender')}>
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" {...register('dob')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" placeholder="9876543210" {...register('phone')} />
              {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="alternatePhone">Alternate Phone (Parent/Guardian)</Label>
              <Input id="alternatePhone" placeholder="Parent/Guardian number" {...register('alternatePhone')} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="student@email.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Home Address</Label>
              <textarea id="address" rows={2} placeholder="Full home address"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                {...register('address')} />
            </div>
          </div>
        </Section>

        {/* 2. Academic Details */}
        <Section icon={BookOpen} title="Academic Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="course">Course / Exam Pursuing</Label>
              <Input id="course" placeholder="e.g. CA, NEET, UPSC, B.Tech" {...register('course')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="studyLevel">Year / Grade / Level of Study</Label>
              <Input id="studyLevel" placeholder="e.g. Final Year, CA Final, 12th" {...register('studyLevel')} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="institution">Institution (School / College / University)</Label>
              <Input id="institution" placeholder="Name of institution" {...register('institution')} />
            </div>
          </div>
        </Section>

        {/* 3. Study Preferences */}
        <Section icon={Clock} title="Study Preferences">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="studyHoursPerDay">Daily Study Hours at Reading Room</Label>
              <select id="studyHoursPerDay" className={sel} {...register('studyHoursPerDay')}>
                <option value="">Select hours</option>
                <option value="1-4 hour">1–4 Hours</option>
                <option value="4-12 hour">4–12 Hours</option>
                <option value="12+">12+ Hours</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="preferredStudyTime">Preferred Study Time</Label>
              <select id="preferredStudyTime" className={sel} {...register('preferredStudyTime')}>
                <option value="">Select time</option>
                <option value="Early Morning">Early Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Late Night">Late Night</option>
                <option value="Early Morning, Afternoon">Early Morning & Afternoon</option>
                <option value="Afternoon, Evening">Afternoon & Evening</option>
                <option value="Evening, Late Night">Evening & Late Night</option>
                <option value="Early Morning, Afternoon, Evening, Late Night">All Day</option>
              </select>
            </div>
          </div>
        </Section>

        {/* 4. Reference */}
        <Section icon={Info} title="How Did You Hear About Us?">
          <div className="space-y-1.5 w-full sm:w-1/2">
            <Label htmlFor="referralSource">Referral Source</Label>
            <select id="referralSource" className={sel} {...register('referralSource')}>
              <option value="">Select source</option>
              <option value="FRIENDS AND FAMILY">Friends &amp; Family</option>
              <option value="GOOGLE MAPS">Google Maps</option>
              <option value="SOCIAL MEDIA">Social Media</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="BANNER AD">Banner / Hoarding Ad</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </Section>

        {/* 5. Government ID */}
        <Section icon={CreditCard} title="Government ID">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="govtIdType">ID Type</Label>
              <select id="govtIdType" className={sel} {...register('govtIdType')}>
                <option value="">Select ID type</option>
                <option value="AADHAAR">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="DRIVING_LICENCE">Driving Licence</option>
                <option value="PASSPORT">Passport</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="govtIdNumber">ID Number</Label>
              <Input id="govtIdNumber" placeholder="Enter ID number" {...register('govtIdNumber')} />
            </div>
          </div>
        </Section>

        {/* 6. Membership — new only */}
        {!isEdit && (
          <Section icon={Building2} title="Membership Details">
            <p className="text-xs text-gray-400 -mt-2">Leave dates blank to assign membership later.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" {...register('startDate')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" {...register('endDate')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <select id="paymentStatus" className={sel} {...register('paymentStatus')}>
                  <option value="PENDING">Pending</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cabinId">Assign Cabin (optional)</Label>
                <select id="cabinId" className={sel} {...register('cabinId')}>
                  <option value="">No cabin yet</option>
                  {vacantCabins.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.cabinNo} — {c.roomName} [{c.category}]{c.monthlyPrice ? ` · ₹${Number(c.monthlyPrice).toLocaleString('en-IN')}/mo` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lockerId">Assign Locker (optional)</Label>
                <select id="lockerId" className={sel} {...register('lockerId')}>
                  <option value="">No locker yet</option>
                  {vacantLockers.map((l) => (
                    <option key={l.id} value={l.id}>{l.lockerNo} — {l.area}</option>
                  ))}
                </select>
              </div>
            </div>
          </Section>
        )}

        {/* 7. Status — edit only */}
        {isEdit && (
          <Section icon={Info} title="Student Status">
            <div className="w-48 space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select id="status" className={sel} {...register('status')}>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="PAUSED">Paused</option>
                <option value="LEFT">Left</option>
              </select>
            </div>
          </Section>
        )}

        <div className="flex gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => navigate('/students')}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
              : isEdit ? 'Update Student' : 'Register Student'}
          </Button>
        </div>
      </form>
    </div>
  );
}
