import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const cabins = await prisma.cabin.findMany({
    orderBy: { cabinNo: 'asc' },
    include: {
      memberships: {
        where: {
          endDate: { gte: new Date() },
        },
        orderBy: { endDate: 'desc' },
        take: 1,
        include: {
          student: { select: { id: true, name: true, studentCode: true, phone: true } },
        },
      },
    },
  });

  const today = new Date();
  const soonDate = new Date();
  soonDate.setDate(soonDate.getDate() + 30);

  const enriched = cabins.map((c) => {
    const activeMembership = c.memberships[0] ?? null;
    let status = c.status;
    if (activeMembership) {
      const end = new Date(activeMembership.endDate);
      status = end <= soonDate && end >= today ? 'EXPIRING_SOON' : 'OCCUPIED';
    }
    return { ...c, status, activeMembership };
  });

  res.json({ cabins: enriched });
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const cabin = await prisma.cabin.findUnique({
    where: { id: req.params.id },
    include: {
      memberships: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { student: { select: { id: true, name: true, studentCode: true } } },
      },
    },
  });
  if (!cabin) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ cabin });
});

router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    cabinNo: z.string().min(1),
    roomName: z.string().default(''),
    category: z.string().default('RRR 1.0'),
    cabinType: z.enum(['STANDARD', 'PREMIUM', 'AC']).default('STANDARD'),
    status: z.enum(['VACANT', 'OCCUPIED', 'EXPIRING_SOON', 'INACTIVE']).default('VACANT'),
    monthlyPrice: z.number().positive().optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const exists = await prisma.cabin.findFirst({ where: { cabinNo: parsed.data.cabinNo } });
  if (exists) { res.status(409).json({ error: 'Cabin number already exists' }); return; }

  const cabin = await prisma.cabin.create({ data: parsed.data });
  res.status(201).json({ cabin });
});

router.put('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    cabinNo: z.string().min(1).optional(),
    roomName: z.string().optional(),
    category: z.string().optional(),
    cabinType: z.enum(['STANDARD', 'PREMIUM', 'AC']).optional(),
    status: z.enum(['VACANT', 'OCCUPIED', 'EXPIRING_SOON', 'INACTIVE']).optional(),
    monthlyPrice: z.number().positive().optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const cabin = await prisma.cabin.update({ where: { id: req.params.id }, data: parsed.data });
  res.json({ cabin });
});

router.post('/:id/release', async (req: Request, res: Response): Promise<void> => {
  const cabinId = req.params.id;

  const activeMembership = await prisma.membership.findFirst({
    where: { cabinId, endDate: { gte: new Date() } },
    orderBy: { endDate: 'desc' },
  });

  if (activeMembership) {
    await prisma.membership.update({
      where: { id: activeMembership.id },
      data: { endDate: new Date(), cabinId: null },
    });
  }

  const cabin = await prisma.cabin.update({
    where: { id: cabinId },
    data: { status: 'VACANT', currentMembershipId: null },
  });

  res.json({ cabin });
});

export default router;
