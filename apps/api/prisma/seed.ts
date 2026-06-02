import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@readingroom.com' } });
  if (!existing) {
    const passwordHash = await bcrypt.hash('Admin@1234', 12);
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@readingroom.com',
        passwordHash,
        role: 'ADMIN',
      },
    });
    console.log('✅ Default admin created: admin@readingroom.com / Admin@1234');
  } else {
    console.log('ℹ️  Admin user already exists, skipping.');
  }

  const cabinCount = await prisma.cabin.count();
  if (cabinCount === 0) {
    type CabinSeed = { cabinNo: string; roomName: string; category: string; cabinType: 'STANDARD' | 'PREMIUM' | 'AC'; status: 'VACANT' };
    const cabins: CabinSeed[] = [
      // A — General (RRR 1.0)
      ...['A1','A2','A3','A4'].map((n) => ({ cabinNo: n, roomName: 'General', category: 'RRR 1.0', cabinType: 'STANDARD' as const, status: 'VACANT' as const })),
      // B — NON AC Premium (RRR 1.0)
      ...['B1','B2','B3','B4','B5','B6','B7'].map((n) => ({ cabinNo: n, roomName: 'NON AC Premium', category: 'RRR 1.0', cabinType: 'PREMIUM' as const, status: 'VACANT' as const })),
      // C — Deluxe Room 1 (RRR 1.0)
      ...['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10','C11','C12','C13'].map((n) => ({ cabinNo: n, roomName: 'Deluxe Room 1', category: 'RRR 1.0', cabinType: 'PREMIUM' as const, status: 'VACANT' as const })),
      // D — Deluxe Room 2 (RRR 1.0)
      ...['D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13'].map((n) => ({ cabinNo: n, roomName: 'Deluxe Room 2', category: 'RRR 1.0', cabinType: 'PREMIUM' as const, status: 'VACANT' as const })),
      // P — AC Premium (RRR 1.0)
      ...['P1','P2','P3','P4','P5','P6','P7','P8','P9','P10','P11','P12','P13','P14','P15','P16'].map((n) => ({ cabinNo: n, roomName: 'AC Premium', category: 'RRR 1.0', cabinType: 'AC' as const, status: 'VACANT' as const })),
      // WP — Private (RRR 2.0)
      { cabinNo: 'WP1', roomName: 'Pvt-1', category: 'RRR 2.0', cabinType: 'AC' as const, status: 'VACANT' as const },
      { cabinNo: 'WP2', roomName: 'Pvt-2', category: 'RRR 2.0', cabinType: 'AC' as const, status: 'VACANT' as const },
      // R — General (RRR 2.0)
      ...['R1','R2','R3','R4','R5','R6','R7','R8','R9','R10','R11','R12','R13','R14','R15','R16','R17','R18','R19','R20','R21','R22','R23','R24','R25','R26','R27','R28','R29','R30'].map((n) => ({ cabinNo: n, roomName: 'General', category: 'RRR 2.0', cabinType: 'STANDARD' as const, status: 'VACANT' as const })),
      // K — Elite (RRR 2.0)
      ...['K1','K2','K3','K4','K5','K6','K7','K8','K9','K10','K11','K12','K13','K14','K15','K16','K17','K18','K19','K20','K21','K22','K23','K24','K25'].map((n) => ({ cabinNo: n, roomName: 'Elite', category: 'RRR 2.0', cabinType: 'PREMIUM' as const, status: 'VACANT' as const })),
    ];
    await prisma.cabin.createMany({ data: cabins });
    console.log(`✅ ${cabins.length} cabins seeded with room names and categories`);
  } else {
    console.log('ℹ️  Cabins already exist, skipping.');
  }

  const lockerCount = await prisma.locker.count();
  if (lockerCount === 0) {
    const lockers = [
      { lockerNo: 'L1',  area: 'General Locker', status: 'VACANT' as const },
      { lockerNo: 'L2',  area: 'General Locker', status: 'VACANT' as const },
      { lockerNo: 'L3',  area: 'General Locker', status: 'VACANT' as const },
      { lockerNo: 'L4',  area: 'General Locker', status: 'VACANT' as const },
      { lockerNo: 'L5',  area: 'General Locker', status: 'VACANT' as const },
      { lockerNo: 'L6',  area: 'Elite Locker',   status: 'VACANT' as const },
      { lockerNo: 'L7',  area: 'Elite Locker',   status: 'VACANT' as const },
      { lockerNo: 'L8',  area: 'Elite Locker',   status: 'VACANT' as const },
      { lockerNo: 'L9',  area: 'Elite Locker',   status: 'VACANT' as const },
      { lockerNo: 'L10', area: 'Elite Locker',   status: 'VACANT' as const },
      { lockerNo: 'L11', area: 'Elite Locker',   status: 'VACANT' as const },
      { lockerNo: 'L12', area: 'Elite Locker',   status: 'VACANT' as const },
      { lockerNo: 'L13', area: 'Elite Locker',   status: 'VACANT' as const },
      { lockerNo: 'L14', area: 'Elite Locker',   status: 'VACANT' as const },
      { lockerNo: 'L15', area: 'Elite Locker',   status: 'VACANT' as const },
      { lockerNo: 'L16', area: 'Elite Locker',   status: 'VACANT' as const },
      { lockerNo: 'L17', area: 'Elite Locker',   status: 'VACANT' as const },
      { lockerNo: 'L18', area: 'Elite Locker',   status: 'VACANT' as const },
      { lockerNo: 'L19', area: 'Elite Locker',   status: 'VACANT' as const },
      { lockerNo: 'L20', area: 'Elite Locker',   status: 'VACANT' as const },
    ];
    await prisma.locker.createMany({ data: lockers });
    console.log('✅ 20 lockers seeded (L1–L5 General, L6–L20 Elite)');
  } else {
    console.log('ℹ️  Lockers already exist, skipping.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
