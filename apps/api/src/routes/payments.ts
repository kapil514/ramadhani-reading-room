import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

async function generateInvoiceNumber(): Promise<string> {
  const last = await prisma.payment.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!last) return 'INV-0001';
  const num = parseInt(last.invoiceNumber.split('-')[1] ?? '0', 10);
  return `INV-${String(num + 1).padStart(4, '0')}`;
}

const paymentSchema = z.object({
  membershipId: z.string().min(1),
  studentId: z.string().min(1),
  amount: z.number().positive(),
  paidAt: z.string().optional(),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE']).default('CASH'),
  txnReference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { studentId, membershipId, page = '1', limit = '30' } = req.query as Record<string, string>;

  const where: Record<string, unknown> = {};
  if (studentId) where.studentId = studentId;
  if (membershipId) where.membershipId = membershipId;

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        student: { select: { id: true, name: true, studentCode: true, phone: true } },
        membership: { include: { cabin: { select: { id: true, cabinNo: true, roomName: true } } } },
      },
    }),
  ]);

  res.json({ payments, total, page: Number(page), limit: Number(limit) });
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const { membershipId, studentId, amount, paidAt, paymentMode, txnReference, notes } = parsed.data;

  const invoiceNumber = await generateInvoiceNumber();

  const payment = await prisma.payment.create({
    data: {
      membershipId,
      studentId,
      amount,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      paymentMode,
      txnReference: txnReference ?? null,
      invoiceNumber,
      notes: notes ?? null,
    },
    include: {
      student: { select: { id: true, name: true, studentCode: true } },
      membership: true,
    },
  });

  await prisma.membership.update({
    where: { id: membershipId },
    data: { paymentStatus: 'PAID' },
  });

  res.status(201).json({ payment });
});

router.get('/summary', async (_req: Request, res: Response): Promise<void> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    paymentCount,
    monthCount,
    byMode,
    recentPayments,
    monthlyTrend,
  ] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { paidAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { amount: true } }),
    prisma.payment.count(),
    prisma.payment.count({ where: { paidAt: { gte: startOfMonth } } }),
    prisma.payment.groupBy({ by: ['paymentMode'], _sum: { amount: true }, _count: true }),
    prisma.payment.findMany({
      orderBy: { paidAt: 'desc' },
      take: 10,
      include: {
        student: { select: { id: true, name: true, studentCode: true } },
        membership: { include: { cabin: { select: { cabinNo: true, roomName: true } } } },
      },
    }),
    prisma.$queryRaw<{ month: string; revenue: number }[]>`
      SELECT TO_CHAR(DATE_TRUNC('month', "paidAt"), 'Mon YYYY') AS month,
             SUM(amount)::float AS revenue
      FROM payments
      WHERE "paidAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "paidAt")
      ORDER BY DATE_TRUNC('month', "paidAt") ASC
    `,
  ]);

  const pendingMemberships = await prisma.membership.count({ where: { paymentStatus: { in: ['PENDING', 'PARTIAL'] } } });

  res.json({
    totalRevenue: Number(totalRevenue._sum.amount ?? 0),
    monthRevenue: Number(monthRevenue._sum.amount ?? 0),
    lastMonthRevenue: Number(lastMonthRevenue._sum.amount ?? 0),
    paymentCount,
    monthCount,
    byMode,
    recentPayments,
    monthlyTrend,
    pendingMemberships,
  });
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const payment = await prisma.payment.findUnique({
    where: { id: req.params.id },
    include: {
      student: { select: { id: true, name: true, studentCode: true, phone: true } },
      membership: { include: { cabin: true, locker: true } },
    },
  });
  if (!payment) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ payment });
});

export default router;
