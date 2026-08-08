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

  // 2. Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Apex Industrial Solutions',
      mobile: '+919876543210',
      email: 'contact@apexind.com',
      businessName: 'Apex Industries Pvt Ltd',
      gstNumber: '27AAAAA0000A1Z5',
      customerType: CustomerType.Wholesale,
      address: 'Plot 42, Industrial Area, Sector 18, Pune, MH',
      status: CustomerStatus.Active,
      followUpDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
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

  const customer2 = await prisma.customer.create({
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

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Rohan Sharma',
      mobile: '+919988776655',
      email: 'rohan.sharma@gmail.com',
      customerType: CustomerType.Retail,
      address: 'Flat 301, Sunshine Heights, Mumbai, MH',
      status: CustomerStatus.Lead,
      followUpDate: new Date(Date.now() + 86400000),
      notes: 'Inquired about custom assembly parts.',
    },
  });

  console.log('✅ Customers seeded');

  // 3. Create Products
  const prod1 = await prisma.product.create({
    data: {
      productName: 'Heavy Duty Steel Bearing 50mm',
      sku: 'SKU-BRG-050',
      category: 'Bearings & Fasteners',
      unitPrice: 450.00,
      currentStock: 100,
      minimumStock: 15,
      warehouseLocation: 'Aisle 3, Shelf B2',
    },
  });

  const prod2 = await prisma.product.create({
    data: {
      productName: 'Industrial Hydraulic Valve 2-Way',
      sku: 'SKU-VLV-002',
      category: 'Hydraulics',
      unitPrice: 1250.50,
      currentStock: 25,
      minimumStock: 5,
      warehouseLocation: 'Aisle 1, Rack A',
    },
  });

  const prod3 = await prisma.product.create({
    data: {
      productName: 'High Temp Thermal Gasket Pack',
      sku: 'SKU-GSK-100',
      category: 'Seals & Gaskets',
      unitPrice: 180.00,
      currentStock: 4, // Low stock warning level
      minimumStock: 10,
      warehouseLocation: 'Aisle 4, Bin 12',
    },
  });

  console.log('✅ Products seeded');

  // 4. Create Initial Stock Movements (IN)
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: prod1.id,
        quantity: 100,
        movementType: MovementType.IN,
        reason: 'Initial stock intake from factory batch #882',
        createdById: warehouseUser.id,
      },
      {
        productId: prod2.id,
        quantity: 25,
        movementType: MovementType.IN,
        reason: 'Initial stock intake from supplier invoice #441',
        createdById: warehouseUser.id,
      },
      {
        productId: prod3.id,
        quantity: 4,
        movementType: MovementType.IN,
        reason: 'Sample batch receipt',
        createdById: warehouseUser.id,
      },
    ],
  });

  console.log('✅ Stock Movements seeded');

  // 5. Create Sample Sales Challans
  const challan1 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-0001',
      customerId: customer1.id,
      status: ChallanStatus.CONFIRMED,
      totalQuantity: 10,
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: prod1.id,
            quantity: 10,
            unitPrice: 450.00,
            productNameSnapshot: prod1.productName,
            skuSnapshot: prod1.sku,
          },
        ],
      },
    },
  });

  // Outward stock movement for confirmed challan
  await prisma.stockMovement.create({
    data: {
      productId: prod1.id,
      quantity: 10,
      movementType: MovementType.OUT,
      reason: `Challan Dispatch: ${challan1.challanNumber}`,
      createdById: salesUser.id,
    },
  });

  // Draft Challan
  await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-0002',
      customerId: customer2.id,
      status: ChallanStatus.DRAFT,
      totalQuantity: 5,
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: prod2.id,
            quantity: 5,
            unitPrice: 1250.50,
            productNameSnapshot: prod2.productName,
            skuSnapshot: prod2.sku,
          },
        ],
      },
    },
  });

  console.log('✅ Sales Challans seeded');
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
