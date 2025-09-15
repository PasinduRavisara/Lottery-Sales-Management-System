const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function migrateRoles() {
  try {
    console.log("Starting role migration...");
    
    // Step 1: Add a temporary column with the new enum type
    console.log("Step 1: Adding temporary column...");
    await prisma.$executeRaw`
      ALTER TABLE users ADD COLUMN role_new ENUM('ZONE_MANAGER', 'FIELD_OFFICER') DEFAULT 'FIELD_OFFICER'
    `;

    // Step 2: Update the new column based on old values
    console.log("Step 2: Mapping old roles to new roles...");
    await prisma.$executeRaw`
      UPDATE users SET role_new = 'ZONE_MANAGER' WHERE role = 'ADMIN'
    `;
    await prisma.$executeRaw`
      UPDATE users SET role_new = 'FIELD_OFFICER' WHERE role = 'DEALER'
    `;

    // Step 3: Drop the old column
    console.log("Step 3: Dropping old role column...");
    await prisma.$executeRaw`
      ALTER TABLE users DROP COLUMN role
    `;

    // Step 4: Rename the new column to 'role'
    console.log("Step 4: Renaming new column...");
    await prisma.$executeRaw`
      ALTER TABLE users CHANGE COLUMN role_new role ENUM('ZONE_MANAGER', 'FIELD_OFFICER') NOT NULL DEFAULT 'FIELD_OFFICER'
    `;

    // Step 5: Verify the migration
    console.log("Step 5: Verifying migration...");
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    console.log("Migrated users:", users);
    console.log("✅ Role migration completed successfully!");

  } catch (error) {
    console.error("❌ Error migrating roles:", error);
    console.log("You may need to manually fix the database schema.");
  } finally {
    await prisma.$disconnect();
  }
}

migrateRoles();