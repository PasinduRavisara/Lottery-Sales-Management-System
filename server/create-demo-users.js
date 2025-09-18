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

    // Create demo territory manager user
    const territoryManagerPassword = await bcrypt.hash("admin123", 10);
    const territoryManager = await prisma.user.create({
      data: {
        username: "admin",
        passwordHash: territoryManagerPassword,
        role: "TERRITORY_MANAGER",
      },
    });

    // Create demo sales promotion assistant user
    const salesPromotionAssistantPassword = await bcrypt.hash("dealer123", 10);
    const salesPromotionAssistant = await prisma.user.create({
      data: {
        username: "dealer",
        passwordHash: salesPromotionAssistantPassword,
        role: "SALES_PROMOTION_ASSISTANT",
      },
    });

    console.log("Demo users created successfully:");
    console.log("- Territory Manager: username: admin, password: admin123");
    console.log(
      "- Sales Promotion Assistant: username: dealer, password: dealer123"
    );
  } catch (error) {
    console.error("Error creating demo users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUsers();
