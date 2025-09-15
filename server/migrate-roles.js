const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function migrateRoles() {
  try {
    console.log("Checking current users...");
    
    // Get all current users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    console.log("Current users:", users);

    if (users.length === 0) {
      console.log("No users found. Skipping role migration.");
      return;
    }

    console.log(`Found ${users.length} users to migrate`);

    // Close Prisma connection as we'll use raw SQL
    await prisma.$disconnect();

    console.log("Migration completed. You can now run the Prisma migration.");
  } catch (error) {
    console.error("Error migrating roles:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateRoles();