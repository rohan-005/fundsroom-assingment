import { PrismaClient, Role, CustomerType, CustomerStatus, MovementType, ChallanStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Password hash for 'Password@123'
  const defaultPassword = await bcrypt.hash('Password@123', 10);

  // 1. Create Users for each role
  const admin = await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: { passwordHash: defaultPassword },
    create: {
      email: 'admin@erp.com',
      name: 'System Admin',
      passwordHash: defaultPassword,
      role: Role.ADMIN,
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@erp.com' },
    update: { passwordHash: defaultPassword },
    create: {
      email: 'sales@erp.com',
      name: 'Sarah Sales',
      passwordHash: defaultPassword,
      role: Role.SALES,
    },
  });

  const warehouseUser = await prisma.user.upsert({
    where: { email: 'warehouse@erp.com' },
    update: { passwordHash: defaultPassword },
    create: {
      email: 'warehouse@erp.com',
      name: 'Wayne Warehouse',
      passwordHash: defaultPassword,
      role: Role.WAREHOUSE,
    },
  });

  const accountsUser = await prisma.user.upsert({
    where: { email: 'accounts@erp.com' },
    update: { passwordHash: defaultPassword },
    create: {
      email: 'accounts@erp.com',
      name: 'Alice Accounts',
      passwordHash: defaultPassword,
      role: Role.ACCOUNTS,
    },
  });

  console.log('✅ Users seeded: Admin, Sales, Warehouse, Accounts');

  // 2. Upsert Products
  const prod1 = await prisma.product.upsert({
    where: { sku: 'SKU-BRG-050' },
    update: {},
    create: {
      productName: 'Heavy Duty Steel Bearing 50mm',
      sku: 'SKU-BRG-050',
      category: 'Bearings & Fasteners',
      unitPrice: 450.00,
      currentStock: 100,
      minimumStock: 15,
      warehouseLocation: 'Aisle 3, Shelf B2',
    },
  });

  const prod2 = await prisma.product.upsert({
    where: { sku: 'SKU-VLV-002' },
    update: {},
    create: {
      productName: 'Industrial Hydraulic Valve 2-Way',
      sku: 'SKU-VLV-002',
      category: 'Hydraulics',
      unitPrice: 1250.50,
      currentStock: 25,
      minimumStock: 5,
      warehouseLocation: 'Aisle 1, Rack A',
    },
  });

  const prod3 = await prisma.product.upsert({
    where: { sku: 'SKU-GSK-100' },
    update: {},
    create: {
      productName: 'High Temp Thermal Gasket Pack',
      sku: 'SKU-GSK-100',
      category: 'Seals & Gaskets',
      unitPrice: 180.00,
      currentStock: 4,
      minimumStock: 10,
      warehouseLocation: 'Aisle 4, Bin 12',
    },
  });

  console.log('✅ Products seeded');

  // 3. Upsert Customers
  let customer1 = await prisma.customer.findFirst({ where: { email: 'contact@apexind.com' } });
  if (!customer1) {
    customer1 = await prisma.customer.create({
      data: {
        name: 'Apex Industrial Solutions',
        mobile: '+919876543210',
        email: 'contact@apexind.com',
        businessName: 'Apex Industries Pvt Ltd',
        gstNumber: '27AAAAA0000A1Z5',
        customerType: CustomerType.Wholesale,
        address: 'Plot 42, Industrial Area, Sector 18, Pune, MH',
        status: CustomerStatus.Active,
        followUpDate: new Date(Date.now() + 86400000 * 3),
        notes: 'Key wholesale account for heavy industrial components.',
        followUps: {
          create: [
            {
              note: 'Initial requirements meeting regarding bulk order Q3.',
              date: new Date(Date.now() - 86400000 * 2),
              createdById: salesUser.id,
            },
          ],
        },
      },
    });
  }

  let customer2 = await prisma.customer.findFirst({ where: { email: 'procurement@metrotech.org' } });
  if (!customer2) {
    customer2 = await prisma.customer.create({
      data: {
        name: 'Metro Tech Supplies',
        mobile: '+919812345678',
        email: 'procurement@metrotech.org',
        businessName: 'Metro Hardware Ltd',
        gstNumber: '29BBBBA1111B1Z2',
        customerType: CustomerType.Distributor,
        address: '104 Trade Center, MG Road, Bengaluru, KA',
        status: CustomerStatus.Active,
        notes: 'Regional distributor for electronics hardware.',
      },
    });
  }

  console.log('✅ Customers seeded');
  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
