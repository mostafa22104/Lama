import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { fromIsoDate } from '../common/dates/date-codec.js';
import { PrismaClient } from '../generated/prisma/client.js';
import { MOCK_BUSINESS, MOCK_CHARGES, MOCK_CUSTOMERS } from './mock-definitions.js';
import { seedOctoberInvoices, seedSeptemberInvoices } from './seed-invoices.js';

async function main(): Promise<void> {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    console.log('🌱 Starting mock data seed...');

    // Remove existing test businesses if present
    const existing = await db.business.findMany({
      where: { OR: [{ phone: MOCK_BUSINESS.phone }, { email: MOCK_BUSINESS.email }, { name: 'أكاديمية النور' }] },
    });
    for (const b of existing) {
      await db.business.delete({ where: { id: b.id } });
    }

    // 1. Create Business
    const business = await db.business.create({
      data: {
        ...MOCK_BUSINESS,
        reminderRule: {
          create: { beforeDays: 3, onDueDate: true, afterDays: 3 },
        },
      },
    });
    console.log(`✅ Business created: "${business.name}" (${business.phone})`);

    // 2. Create Charges
    const charges = [];
    for (const def of MOCK_CHARGES) {
      const ch = await db.charge.create({
        data: {
          businessId: business.id,
          title: def.title,
          kind: def.kind,
          amount: def.amount,
          dayOfMonth: def.dayOfMonth ?? null,
          dueDate: def.dueDate ? fromIsoDate(def.dueDate) : null,
          billingFrom: fromIsoDate(def.billingFrom),
        },
      });
      charges.push(ch);
    }
    console.log(`✅ Created ${charges.length} charges`);

    // 3. Create Customers
    const customers = [];
    for (const def of MOCK_CUSTOMERS) {
      const cust = await db.customer.create({
        data: {
          businessId: business.id,
          name: def.name,
          phone: def.phone,
          gender: def.gender,
          note: def.note,
        },
      });
      customers.push(cust);
    }
    console.log(`✅ Created ${customers.length} customers`);

    // 4. Charge Assignments
    const assignMonthly = [0, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    for (const idx of assignMonthly) {
      await db.chargeAssignment.create({ data: { chargeId: charges[0].id, customerId: customers[idx].id } });
    }
    await db.chargeAssignment.create({ data: { chargeId: charges[1].id, customerId: customers[1].id } });
    await db.chargeAssignment.create({ data: { chargeId: charges[2].id, customerId: customers[2].id } });
    await db.chargeAssignment.create({ data: { chargeId: charges[4].id, customerId: customers[3].id } });
    await db.chargeAssignment.create({ data: { chargeId: charges[3].id, customerId: customers[5].id } });

    // 5. Invoices, Payments, Claims
    await seedOctoberInvoices(db, business.id, charges, customers);
    await seedSeptemberInvoices(db, business.id, charges[0].id, customers);
    console.log('✅ Invoices, payments, claims, and reminder logs created');

    console.log('\n🎉 Mock data seeded successfully!');
    console.log('----------------------------------------------------');
    console.log(`📱 Login Phone: 010 1234 5678 (${MOCK_BUSINESS.phone})`);
    console.log(`📧 Login Email: ${MOCK_BUSINESS.email}`);
    console.log(`🏢 Business:    ${MOCK_BUSINESS.name} [${MOCK_BUSINESS.plan.toUpperCase()}]`);
    console.log(`👥 Customers:   ${customers.length} customers loaded`);
    console.log(`💳 Invoices:    Overdue (4), Due Soon (2), Claims (3), Paid (3+)`);
    console.log('----------------------------------------------------\n');
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
