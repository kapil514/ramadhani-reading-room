import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const lockers = await prisma.locker.findMany({
    orderBy: { lockerNo: 'asc' },
    include: {
      currentStudent: { select: { id: true, name: true, studentCode: true, phone: true } },
    },
  });
  res.json({ lockers });
});

router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    lockerNo: z.string().min(1),
    area: z.string().default(''),
    status: z.enum(['VACANT', 'OCCUPIED']).default('VACANT'),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const exists = await prisma.locker.findFirst({ where: { lockerNo: parsed.data.lockerNo } });
  if (exists) { res.status(409).json({ error: 'Locker number already exists' }); return; }

  const locker = await prisma.locker.create({ data: parsed.data });
  res.status(201).json({ locker });
});

router.post('/:id/release', async (req: Request, res: Response): Promise<void> => {
  const lockerId = req.params.id;

  const activeMembership = await prisma.membership.findFirst({
    where: { lockerId, endDate: { gte: new Date() } },
    orderBy: { endDate: 'desc' },
  });

  if (activeMembership) {
    await prisma.membership.update({
      where: { id: activeMembership.id },
      data: { lockerId: null },
    });
  }

  const locker = await prisma.locker.update({
    where: { id: lockerId },
    data: { status: 'VACANT', currentStudentId: null },
  });

  res.json({ locker });
});

export default router;
