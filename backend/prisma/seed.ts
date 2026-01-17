import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Seed...');

  // Clean up existing data
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.productInventory.deleteMany();
  await prisma.rawMaterialInventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.rawMaterial.deleteMany();
  await prisma.cashShift.deleteMany();
  await prisma.auditLog.deleteMany(); // If you have this table
  await prisma.user.deleteMany();
  await prisma.store.deleteMany();

  // 1. Create a Store
  const store = await prisma.store.create({
    data: { name: 'Downtown Branch', location: 'New York, NY' }
  });
  console.log(`Created Store: ${store.name}`);

  // 2. Create Users (RBAC Setup)
  
  // Hash passwords for users
  const cashierPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('adminpassword', 10);
  
  // A. The Cashier
  await prisma.user.create({
    data: {
      username: 'cashier1',
      password: cashierPassword,
      role: 'CASHIER',
      storeId: store.id
    }
  });
  console.log('Created User: cashier1 (Role: CASHIER)');

  // B. The Admin
  await prisma.user.create({
    data: {
      username: 'admin1',
      password: adminPassword,
      role: 'ADMIN',
      storeId: store.id
    }
  });
  console.log('Created User: admin1 (Role: ADMIN)');

  // 3. Create Raw Materials
  const flour = await prisma.rawMaterial.create({
    data: { name: 'Flour', unit: 'kg' }
  });
  
  const beef = await prisma.rawMaterial.create({
    data: { name: 'Ground Beef', unit: 'kg' }
  });

  // 4. Stock Raw Materials
  await prisma.rawMaterialInventory.createMany({
    data: [
      { storeId: store.id, materialId: flour.id, stock: 50.00 },
      { storeId: store.id, materialId: beef.id, stock: 20.00 },
    ]
  });

  // 5. Create Manufactured Product (Burger)
  const burger = await prisma.product.create({
    data: {
      name: 'Classic Beef Burger',
      price: 12.50,
      sku: 'BURGER-001',
      isComposite: true
    }
  });

  // CRITICAL: Link Burger to Store (Stock 0 is fine for manufactured items)
  // This allows the POS to identify the storeId when selling a burger
  await prisma.productInventory.create({
    data: { 
      storeId: store.id, 
      productId: burger.id, 
      stock: 0 
    }
  });

  // 6. Create Recipe (BOM)
  await prisma.recipeItem.createMany({
    data: [
      { productId: burger.id, materialId: flour.id, qtyRequired: 0.2 },
      { productId: burger.id, materialId: beef.id, qtyRequired: 0.15 }
    ]
  });

  // 7. Create Retail Product (Coke)
  const coke = await prisma.product.create({
    data: { name: 'Coca Cola', price: 2.00, sku: 'DRINK-001', isComposite: false }
  });
  
  // Stock the Coke
  await prisma.productInventory.create({
    data: { storeId: store.id, productId: coke.id, stock: 100 }
  });

  console.log('✅ Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });