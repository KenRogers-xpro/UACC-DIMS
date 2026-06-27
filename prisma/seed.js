const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash passwords - using 12 rounds as recommended in README.md
  const passwordHash = await bcrypt.hash('Password123', 12);

  // General Manager
  const gm = await prisma.user.upsert({
    where: { email: 'nakibus@uacc.go.ug' },
    update: {},
    create: {
      name: 'Lt. Gen. Nakibus Lakara',
      email: 'nakibus@uacc.go.ug',
      password: passwordHash,
      role: 'GENERAL_MANAGER',
      department: 'GENERAL_MANAGER_OFFICE',
      isActive: true,
    },
  });
  console.log(`✓ Seeded: ${gm.name} (${gm.role})`);

  // IT Administrator
  const admin = await prisma.user.upsert({
    where: { email: 'patrick@uacc.go.ug' },
    update: {},
    create: {
      name: 'Patrick Katusabe',
      email: 'patrick@uacc.go.ug',
      password: passwordHash,
      role: 'IT_ADMINISTRATOR',
      department: 'FINANCE_AND_ADMINISTRATION',
      isActive: true,
    },
  });
  console.log(`✓ Seeded: ${admin.name} (${admin.role})`);

  // Department Head
  const deptHead = await prisma.user.upsert({
    where: { email: 'head@uacc.go.ug' },
    update: {},
    create: {
      name: 'Sarah Nabakooza',
      email: 'head@uacc.go.ug',
      password: passwordHash,
      role: 'DEPARTMENT_HEAD',
      department: 'ENGINEERING',
      isActive: true,
    },
  });
  console.log(`✓ Seeded: ${deptHead.name} (${deptHead.role})`);

  // Staff
  const staff = await prisma.user.upsert({
    where: { email: 'staff@uacc.go.ug' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'staff@uacc.go.ug',
      password: passwordHash,
      role: 'STAFF',
      department: 'ENGINEERING',
      isActive: true,
    },
  });
  console.log(`✓ Seeded: ${staff.name} (${staff.role})`);

  // Auditor
  const auditor = await prisma.user.upsert({
    where: { email: 'auditor@uacc.go.ug' },
    update: {},
    create: {
      name: 'Alice Nsubuga',
      email: 'auditor@uacc.go.ug',
      password: passwordHash,
      role: 'AUDITOR',
      department: 'FINANCE_AND_ADMINISTRATION',
      isActive: true,
    },
  });
  // Records Executive
  const recordsExec = await prisma.user.upsert({
    where: { email: 'records@uacc.go.ug' },
    update: {},
    create: {
      name: 'Records Executive',
      email: 'records@uacc.go.ug',
      password: passwordHash,
      role: 'RECORDS_EXECUTIVE',
      department: 'FINANCE_AND_ADMINISTRATION',
      isActive: true,
    },
  });
  console.log(`✓ Seeded: ${recordsExec.name} (${recordsExec.role})`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
