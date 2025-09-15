const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createDemoUsers() {
  try {
    console.log("Creating demo users...");

    // Check if users already exist
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      console.log("Demo users already exist");
      return;
    }

    // Create demo zone manager user
    const zoneManagerPassword = await bcrypt.hash("admin123", 10);
    const zoneManager = await prisma.user.create({
      data: {
        username: "admin",
        passwordHash: zoneManagerPassword,
        role: "ZONE_MANAGER",
      },
    });

    // Create demo field officer user
    const fieldOfficerPassword = await bcrypt.hash("dealer123", 10);
    const fieldOfficer = await prisma.user.create({
      data: {
        username: "dealer",
        passwordHash: fieldOfficerPassword,
        role: "FIELD_OFFICER",
      },
    });

    console.log("Demo users created successfully:");
    console.log("- Zone Manager: username: admin, password: admin123");
    console.log("- Field Officer: username: dealer, password: dealer123");
  } catch (error) {
    console.error("Error creating demo users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUsers();
