import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // สร้าง admin user เริ่มต้น (เปลี่ยน password หลัง deploy จริง)
  const adminPasswordHash = await bcrypt.hash('ChangeMe123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  // สร้าง departments ตัวอย่างเริ่มต้น
  const departmentNames = [
    { name: 'Information Technology', code: 'IT' },
    { name: 'Human Resources', code: 'HR' },
    { name: 'Finance', code: 'FIN' },
    { name: 'Sales', code: 'SALES' },
    { name: 'Marketing', code: 'MKT' },
    { name: 'Engineering', code: 'ENG' },
  ];

  for (const dept of departmentNames) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }

  console.log('Seed completed. Admin user:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
