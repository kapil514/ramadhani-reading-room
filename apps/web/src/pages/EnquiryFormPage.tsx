import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Enquiry } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  course: z.string().min(1, 'Course is required'),
  enquiryDate: z.string().optional(),
  leadStatus: z.enum(['NOT_INTERESTED', 'FOLLOW_UP', 'JOINED']),
  lastFollowupDate: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EnquiryFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(isEdit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      leadStatus: 'FOLLOW_UP',
      enquiryDate: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    api.get<{ enquiry: Enquiry }>(`/enquiries/${id}`).then(({ enquiry }) => {
      reset({
        name: enquiry.name,
        phone: enquiry.phone,
        email: enquiry.email ?? '',
        course: enquiry.course,
        enquiryDate: enquiry.enquiryDate?.split('T')[0] ?? '',
        leadStatus: enquiry.leadStatus,
        lastFollowupDate: enquiry.lastFollowupDate?.split('T')[0] ?? '',
        notes: enquiry.notes ?? '',
      });
      setLoading(false);
    });
  }, [id, isEdit, reset]);

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      if (isEdit && id) {
        await api.put(`/enquiries/${id}`, data);
      } else {
        await api.post('/enquiries', data);
      }
      navigate('/enquiries');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/enquiries')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Enquiry' : 'New Enquiry'}</h1>
          <p className="text-sm text-gray-500">{isEdit ? 'Update enquiry details' : 'Capture a new walk-in enquiry'}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        {serverError && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" placeholder="Student name" {...register('name')} />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" placeholder="9876543210" {...register('phone')} />
              {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" placeholder="student@email.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="course">Course / Exam Pursuing *</Label>
              <Input id="course" placeholder="e.g. UPSC, CA, NEET" {...register('course')} />
              {errors.course && <p className="text-xs text-red-600">{errors.course.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="enquiryDate">Enquiry Date</Label>
              <Input id="enquiryDate" type="date" {...register('enquiryDate')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="leadStatus">Status *</Label>
              <select
                id="leadStatus"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('leadStatus')}
              >
                <option value="FOLLOW_UP">Follow Up</option>
                <option value="NOT_INTERESTED">Not Interested</option>
                <option value="JOINED">Joined</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lastFollowupDate">Last Follow-up Date</Label>
              <Input id="lastFollowupDate" type="date" {...register('lastFollowupDate')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes / Remarks</Label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Any additional notes…"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              {...register('notes')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate('/enquiries')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
              ) : (
                isEdit ? 'Update Enquiry' : 'Save Enquiry'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
