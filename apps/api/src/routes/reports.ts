import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/dashboard', async (_req: Request, res: Response): Promise<void> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [
    totalStudents,
    activeStudents,
    newThisMonth,
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    pendingPayments,
    expiringMemberships,
    vacantCabins,
    occupiedCabins,
    byMode,
    monthlyTrend,
    genderBreakdown,
    courseBreakdown,
    referralBreakdown,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: 'ACTIVE' } }),
    prisma.student.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { paidAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { amount: true } }),
    prisma.membership.count({ where: { paymentStatus: { in: ['PENDING', 'PARTIAL'] }, endDate: { gte: now } } }),
    prisma.membership.findMany({
      where: { endDate: { gte: now, lte: thirtyDaysFromNow } },
      orderBy: { endDate: 'asc' },
      take: 10,
      include: { student: { select: { id: true, name: true, studentCode: true, phone: true } }, cabin: { select: { cabinNo: true, roomName: true } } },
    }),
    prisma.cabin.count({ where: { status: 'VACANT' } }),
    prisma.cabin.count({ where: { status: 'OCCUPIED' } }),
    prisma.payment.groupBy({ by: ['paymentMode'], _sum: { amount: true }, _count: true }),
    prisma.$queryRaw<{ month: string; revenue: number; count: number }[]>`
      SELECT TO_CHAR(DATE_TRUNC('month', "paidAt"), 'Mon YYYY') AS month,
             SUM(amount)::float AS revenue,
             COUNT(*)::int AS count
      FROM payments
      WHERE "paidAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "paidAt")
      ORDER BY DATE_TRUNC('month', "paidAt") ASC
    `,
    prisma.student.groupBy({ by: ['gender'], _count: true }),
    prisma.student.groupBy({ by: ['course'], _count: true, orderBy: { _count: { course: 'desc' } }, take: 10 }),
    prisma.student.groupBy({ by: ['referralSource'], _count: true, orderBy: { _count: { referralSource: 'desc' } } }),
  ]);

  res.json({
    students: { total: totalStudents, active: activeStudents, newThisMonth },
    revenue: {
      total: Number(totalRevenue._sum.amount ?? 0),
      thisMonth: Number(monthRevenue._sum.amount ?? 0),
      lastMonth: Number(lastMonthRevenue._sum.amount ?? 0),
    },
    pendingPayments,
    expiringMemberships,
    cabins: { vacant: vacantCabins, occupied: occupiedCabins },
    byMode,
    monthlyTrend,
    genderBreakdown,
    courseBreakdown,
    referralBreakdown,
  });
});

export default router;
