import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const studentSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  phone: z.string().min(1),
  alternatePhone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')),
  dob: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  govtIdType: z.enum(['AADHAAR', 'PAN', 'DRIVING_LICENCE', 'PASSPORT']).optional().nullable(),
  govtIdNumber: z.string().optional().nullable(),
  govtIdUrl: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  institution: z.string().optional().nullable(),
  studyLevel: z.string().optional().nullable(),
  studyHoursPerDay: z.string().optional().nullable(),
  preferredStudyTime: z.string().optional().nullable(),
  referralSource: z.string().optional().nullable(),
  fingerprintId: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'PAUSED', 'LEFT']).default('ACTIVE'),
  enquiryId: z.string().optional().nullable(),
});

const membershipSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  cabinId: z.string().optional().nullable(),
  lockerId: z.string().optional().nullable(),
  paymentStatus: z.enum(['PAID', 'PARTIAL', 'PENDING']).default('PENDING'),
});

async function generateStudentCode(): Promise<string> {
  const last = await prisma.student.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!last) return 'RRR-0001';
  const num = parseInt(last.studentCode.split('-')[1] ?? '0', 10);
  return `RRR-${String(num + 1).padStart(4, '0')}`;
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { search, status, page = '1', limit = '20' } = req.query as Record<string, string>;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { studentCode: { contains: search, mode: 'insensitive' } },
      { course: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        memberships: {
          orderBy: { createdAt: 'desc' },
          include: { cabin: { select: { id: true, cabinNo: true, roomName: true } }, locker: true },
        },
      },
    }),
  ]);

  res.json({ students, total, page: Number(page), limit: Number(limit) });
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const student = await prisma.student.findUnique({
    where: { id: req.params.id },
    include: {
      memberships: {
        orderBy: { createdAt: 'desc' },
        include: { cabin: true, locker: true, payments: true },
      },
    },
  });
  if (!student) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ student });
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = studentSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const { dob, email, govtIdType, govtIdUrl, photoUrl, fingerprintId, enquiryId, ...rest } = parsed.data;

  const existing = await prisma.student.findFirst({ where: { phone: rest.phone } });
  if (existing) { res.status(409).json({ error: 'A student with this phone number already exists' }); return; }

  const studentCode = await generateStudentCode();

  const student = await prisma.student.create({
    data: {
      ...rest,
      studentCode,
      email: email || null,
      dob: dob ? new Date(dob) : null,
      govtIdType: govtIdType ?? null,
      govtIdUrl: govtIdUrl ?? null,
      photoUrl: photoUrl ?? null,
      fingerprintId: fingerprintId ?? null,
      enquiryId: enquiryId ?? null,
    },
  });

  if (enquiryId) {
    await prisma.enquiry.update({
      where: { id: enquiryId },
      data: { leadStatus: 'JOINED', convertedStudentId: student.id },
    });
  }

  res.status(201).json({ student });
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const parsed = studentSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const { dob, email, govtIdType, govtIdUrl, photoUrl, fingerprintId, enquiryId, ...rest } = parsed.data;

  const student = await prisma.student.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      ...(email !== undefined ? { email: email || null } : {}),
      ...(dob !== undefined ? { dob: dob ? new Date(dob) : null } : {}),
      ...(govtIdType !== undefined ? { govtIdType: govtIdType ?? null } : {}),
      ...(govtIdUrl !== undefined ? { govtIdUrl: govtIdUrl ?? null } : {}),
      ...(photoUrl !== undefined ? { photoUrl: photoUrl ?? null } : {}),
      ...(fingerprintId !== undefined ? { fingerprintId: fingerprintId ?? null } : {}),
    },
  });

  res.json({ student });
});

router.get('/:id/memberships', async (req: Request, res: Response): Promise<void> => {
  const memberships = await prisma.membership.findMany({
    where: { studentId: req.params.id },
    orderBy: { createdAt: 'desc' },
    include: { cabin: true, locker: true, payments: true },
  });
  res.json({ memberships });
});

router.post('/:id/memberships', async (req: Request, res: Response): Promise<void> => {
  const parsed = membershipSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const { startDate, endDate, cabinId, lockerId, paymentStatus } = parsed.data;

  if (cabinId) {
    const prevCabinMembership = await prisma.membership.findFirst({
      where: { cabinId, endDate: { gte: new Date() } },
      orderBy: { endDate: 'desc' },
    });
    if (prevCabinMembership) {
      await prisma.membership.update({
        where: { id: prevCabinMembership.id },
        data: { endDate: new Date(), cabinId: null },
      });
    }
  }

  if (lockerId) {
    const prevLockerMembership = await prisma.membership.findFirst({
      where: { lockerId, endDate: { gte: new Date() } },
      orderBy: { endDate: 'desc' },
    });
    if (prevLockerMembership) {
      await prisma.membership.update({
        where: { id: prevLockerMembership.id },
        data: { lockerId: null },
      });
      await prisma.locker.update({
        where: { id: lockerId },
        data: { currentStudentId: null },
      });
    }
  }

  // Derive amountDue from cabin monthlyPrice if cabin is selected
  let amountDue: number | null = null;
  if (cabinId) {
    const cabin = await prisma.cabin.findUnique({ where: { id: cabinId }, select: { monthlyPrice: true } });
    if (cabin?.monthlyPrice) amountDue = Number(cabin.monthlyPrice);
  }

  const membership = await prisma.membership.create({
    data: {
      studentId: req.params.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      cabinId: cabinId ?? null,
      lockerId: lockerId ?? null,
      paymentStatus,
      ...(amountDue !== null ? { amountDue } : {}),
    },
    include: { cabin: true, locker: true },
  });

  if (cabinId) {
    await prisma.cabin.update({
      where: { id: cabinId },
      data: { status: 'OCCUPIED', currentMembershipId: membership.id },
    });
  }
  if (lockerId) {
    await prisma.locker.update({
      where: { id: lockerId },
      data: { status: 'OCCUPIED', currentStudentId: req.params.id },
    });
  }

  await prisma.student.update({ where: { id: req.params.id }, data: { status: 'ACTIVE' } });

  res.status(201).json({ membership });
});

export default router;
