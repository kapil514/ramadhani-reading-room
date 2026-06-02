import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const enquirySchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  course: z.string().min(1),
  enquiryDate: z.string().optional(),
  leadStatus: z.enum(['NOT_INTERESTED', 'FOLLOW_UP', 'JOINED']).default('FOLLOW_UP'),
  lastFollowupDate: z.string().optional().nullable(),
  notes: z.string().optional(),
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status, search, page = '1', limit = '50' } = req.query as Record<string, string>;

  const where: Record<string, unknown> = {};
  if (status) where.leadStatus = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { course: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, enquiries] = await Promise.all([
    prisma.enquiry.count({ where }),
    prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
  ]);

  res.json({ enquiries, total });
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const enquiry = await prisma.enquiry.findUnique({ where: { id: req.params.id } });
  if (!enquiry) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ enquiry });
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = enquirySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const { enquiryDate, lastFollowupDate, email, ...rest } = parsed.data;
  const enquiry = await prisma.enquiry.create({
    data: {
      ...rest,
      email: email || null,
      enquiryDate: enquiryDate ? new Date(enquiryDate) : new Date(),
      lastFollowupDate: lastFollowupDate ? new Date(lastFollowupDate) : null,
    },
  });
  res.status(201).json({ enquiry });
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const parsed = enquirySchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const { enquiryDate, lastFollowupDate, email, ...rest } = parsed.data;
  const enquiry = await prisma.enquiry.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      ...(email !== undefined ? { email: email || null } : {}),
      ...(enquiryDate ? { enquiryDate: new Date(enquiryDate) } : {}),
      ...(lastFollowupDate !== undefined
        ? { lastFollowupDate: lastFollowupDate ? new Date(lastFollowupDate) : null }
        : {}),
    },
  });
  res.json({ enquiry });
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  await prisma.enquiry.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

export default router;
