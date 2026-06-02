import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Students from Excel sheet (name, cabinNo, endDate)
const cabinStudents: { name: string; cabinNo: string; endDate: string }[] = [
  { name: 'Akshay',                    cabinNo: 'A1',  endDate: '2026-06-23' },
  { name: 'Yuvaraju D',                cabinNo: 'A2',  endDate: '2026-06-28' },
  { name: 'Aravind cc Lohith',         cabinNo: 'P3',  endDate: '2026-06-25' },
  { name: 'Nithin Amma',               cabinNo: 'P4',  endDate: '2026-06-19' },
  { name: 'Murari',                    cabinNo: 'P5',  endDate: '2026-06-30' },
  { name: 'Madhurima',                 cabinNo: 'P6',  endDate: '2026-06-30' },
  { name: 'Raghavendra Reddy',         cabinNo: 'P7',  endDate: '2026-06-18' },
  { name: 'Nagarjuna Balla',           cabinNo: 'P8',  endDate: '2026-06-27' },
  { name: 'Princy Surekha',            cabinNo: 'P9',  endDate: '2026-07-03' },
  { name: 'Vinay Tippireddy',          cabinNo: 'P10', endDate: '2026-06-04' },
  { name: 'Tushar Sao',                cabinNo: 'P11', endDate: '2026-06-04' },
  { name: 'Ravali Chittari',           cabinNo: 'P12', endDate: '2026-06-07' },
  { name: 'Arun Kumar',                cabinNo: 'P13', endDate: '2026-06-03' },
  { name: 'Shashank Shiva',            cabinNo: 'P14', endDate: '2026-06-16' },
  { name: 'Dr Kalyan',                 cabinNo: 'P15', endDate: '2026-06-11' },
  { name: 'Mallik Polishetty',         cabinNo: 'P16', endDate: '2026-06-14' },
  { name: 'Lalu Prasad',               cabinNo: 'R2',  endDate: '2026-06-24' },
  { name: 'Paramesh Naik',             cabinNo: 'R3',  endDate: '2026-06-20' },
  { name: 'B Sai Teja Sree',           cabinNo: 'R5',  endDate: '2026-06-25' },
  { name: 'Shiva Nayak Pathlavath',    cabinNo: 'R6',  endDate: '2026-06-08' },
  { name: 'Sanjeevan',                 cabinNo: 'R8',  endDate: '2026-06-10' },
  { name: 'Divya Chennuru',            cabinNo: 'R9',  endDate: '2026-06-07' },
  { name: 'Shashi Shivnath',           cabinNo: 'R10', endDate: '2026-06-07' },
  { name: 'Sai Dikshitha',             cabinNo: 'R11', endDate: '2026-06-02' },
  { name: 'Deepthi Bonagiri',          cabinNo: 'R12', endDate: '2026-06-18' },
  { name: 'Anudeep',                   cabinNo: 'R13', endDate: '2026-06-07' },
  { name: 'Sadhwika',                  cabinNo: 'R14', endDate: '2026-06-19' },
  { name: 'Lahari Gontela',            cabinNo: 'R15', endDate: '2026-06-04' },
  { name: 'Ismail Shaik',              cabinNo: 'R16', endDate: '2026-06-06' },
  { name: 'Jaswanth Ajmeera',          cabinNo: 'R17', endDate: '2026-06-26' },
  { name: 'Sai Chandra',               cabinNo: 'R18', endDate: '2026-06-29' },
  { name: 'Akash',                     cabinNo: 'R19', endDate: '2026-05-23' },
  { name: 'Ganesh Maloth',             cabinNo: 'R21', endDate: '2026-06-21' },
  { name: 'Ramesh Sriram',             cabinNo: 'R22', endDate: '2026-06-16' },
  { name: 'Hari Krishna Talari',       cabinNo: 'R23', endDate: '2026-06-16' },
  { name: 'Bhanu Varma',               cabinNo: 'R24', endDate: '2026-06-07' },
  { name: 'Ajay Kumar',                cabinNo: 'R26', endDate: '2026-06-27' },
  { name: 'Sreekar Reddy',             cabinNo: 'R28', endDate: '2026-06-22' },
  { name: 'Afreed',                    cabinNo: 'R29', endDate: '2026-06-14' },
  { name: 'Mahesh Linga',              cabinNo: 'R30', endDate: '2026-06-26' },
  { name: 'Lahari Yalla',              cabinNo: 'K3',  endDate: '2026-06-27' },
  { name: 'Sivunnaidu Mandala',        cabinNo: 'K5',  endDate: '2026-06-29' },
  { name: 'Rajitha Varma',             cabinNo: 'K9',  endDate: '2026-06-16' },
  { name: 'Mani Babu',                 cabinNo: 'K18', endDate: '2026-06-10' },
  { name: 'Nirmala Kommu',             cabinNo: 'K20', endDate: '2026-06-17' },
  { name: 'Devesh D',                  cabinNo: 'K21', endDate: '2026-06-12' },
  { name: 'Priyanka',                  cabinNo: 'K22', endDate: '2026-06-11' },
];

// Locker-only students from Excel (L1 = Srikanth S, L16 = C Jhanson)
const lockerStudents: { name: string; lockerNo: string; endDate: string }[] = [
  { name: 'Srikanth S', lockerNo: 'L1',  endDate: '2026-05-30' },
  { name: 'C Jhanson',  lockerNo: 'L16', endDate: '2026-03-09' },
];

let studentCounter = 0;

async function getNextCode(): Promise<string> {
  if (studentCounter === 0) {
    const last = await prisma.student.findFirst({ orderBy: { createdAt: 'desc' } });
    if (last) {
      studentCounter = parseInt(last.studentCode.split('-')[1] ?? '0', 10);
    }
  }
  studentCounter += 1;
  return `RRR-${String(studentCounter).padStart(4, '0')}`;
}

// phoneCounter is initialised once in main() before any calls
let phoneCounter = 9000;

async function findOrCreateStudent(name: string): Promise<string> {
  const safeName = name.trim();
  const syntheticPhone = `SEED${++phoneCounter}`;

  const existing = await prisma.student.findFirst({
    where: { name: { equals: safeName, mode: 'insensitive' } },
  });
  if (existing) {
    console.log(`  ↩  Existing student: ${existing.name} (${existing.studentCode})`);
    return existing.id;
  }

  const studentCode = await getNextCode();
  const student = await prisma.student.create({
    data: {
      name: safeName,
      studentCode,
      phone: syntheticPhone,
      status: 'ACTIVE',
    },
  });
  console.log(`  ✓  Created: ${student.name} (${student.studentCode})`);
  return student.id;
}

async function main() {
  console.log('\n=== Seeding students from Excel sheet ===\n');

  // Initialise phoneCounter from highest existing SEED phone
  const seedStudents = await prisma.student.findMany({ where: { phone: { startsWith: 'SEED' } } });
  if (seedStudents.length > 0) {
    const nums = seedStudents.map((s) => parseInt(s.phone.replace('SEED', ''), 10)).filter((n) => !isNaN(n));
    phoneCounter = Math.max(...nums, 9000);
  }
  console.log(`Starting phoneCounter at ${phoneCounter}`);

  // ---------- Cabin-assigned students ----------
  console.log('--- Cabin assignments ---');
  for (const entry of cabinStudents) {
    const name = entry.name.trim();
    console.log(`\nProcessing: "${name}" → Cabin ${entry.cabinNo}`);

    const cabin = await prisma.cabin.findFirst({ where: { cabinNo: entry.cabinNo } });
    if (!cabin) {
      console.log(`  ⚠  Cabin ${entry.cabinNo} not found in DB — skipping`);
      continue;
    }

    const studentId = await findOrCreateStudent(name);
    const endDate = new Date(entry.endDate);
    // Use a start date of 30 days before end as a reasonable default
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);

    // Check if cabin is already linked to a membership for this student
    const existingMembership = await prisma.membership.findFirst({
      where: { cabinId: cabin.id, endDate: { gte: new Date('2026-01-01') } },
    });
    if (existingMembership) {
      console.log(`  ↩  Cabin ${entry.cabinNo} already has an active membership — skipping`);
      continue;
    }

    const membership = await prisma.membership.create({
      data: {
        studentId,
        startDate,
        endDate,
        cabinId: cabin.id,
        paymentStatus: 'PENDING',
      },
    });

    await prisma.cabin.update({
      where: { id: cabin.id },
      data: { status: 'OCCUPIED', currentMembershipId: membership.id },
    });

    console.log(`  ✓  Membership created (ends ${entry.endDate}), cabin marked OCCUPIED`);
  }

  // ---------- Locker-only students ----------
  console.log('\n--- Locker-only assignments ---');
  for (const entry of lockerStudents) {
    const name = entry.name.trim();
    console.log(`\nProcessing: "${name}" → Locker ${entry.lockerNo}`);

    const locker = await prisma.locker.findFirst({ where: { lockerNo: entry.lockerNo } });
    if (!locker) {
      console.log(`  ⚠  Locker ${entry.lockerNo} not found — skipping`);
      continue;
    }

    if (locker.currentStudentId) {
      console.log(`  ↩  Locker ${entry.lockerNo} already assigned — skipping`);
      continue;
    }

    const studentId = await findOrCreateStudent(name);

    await prisma.locker.update({
      where: { id: locker.id },
      data: { status: 'OCCUPIED', currentStudentId: studentId },
    });

    console.log(`  ✓  Locker ${entry.lockerNo} assigned`);
  }

  console.log('\n=== Done ===\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
