const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoUsers() {
  try {
    console.log('Creating demo users...');
    
    // Check if users already exist
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      console.log('Demo users already exist');
      return;
    }

    // Create demo admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: adminPassword,
        role: 'ADMIN',
      },
    });

    // Create demo dealer user
    const dealerPassword = await bcrypt.hash('dealer123', 10);
    const dealer = await prisma.user.create({
      data: {
        username: 'dealer',
        passwordHash: dealerPassword,
        role: 'DEALER',
      },
    });

    console.log('Demo users created successfully:');
    console.log('- Admin: username: admin, password: admin123');
    console.log('- Dealer: username: dealer, password: dealer123');
    
  } catch (error) {
    console.error('Error creating demo users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUsers();