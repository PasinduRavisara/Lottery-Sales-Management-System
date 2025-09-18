const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function listAllUsers() {
  try {
    console.log("📋 Fetching all users from database...\n");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });

    const territoryManagers = users.filter(
      (u) => u.role === "TERRITORY_MANAGER"
    );
    const salesPromotionAssistants = users.filter(
      (u) => u.role === "SALES_PROMOTION_ASSISTANT"
    );

    console.log("=".repeat(60));
    console.log("👥 CURRENT USERS IN DATABASE");
    console.log("=".repeat(60));
    console.log(`Total Users: ${users.length}`);
    console.log(`Territory Managers: ${territoryManagers.length}`);
    console.log(
      `Sales Promotion Assistants: ${salesPromotionAssistants.length}`
    );
    console.log("");

    if (territoryManagers.length > 0) {
      console.log("🏢 TERRITORY MANAGERS:");
      territoryManagers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username}`);
      });
      console.log("");
    }

    if (salesPromotionAssistants.length > 0) {
      console.log("👨‍💼 SALES PROMOTION ASSISTANTS:");
      salesPromotionAssistants.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username}`);
      });
      console.log("");
    }

    console.log("✅ User listing completed!");
  } catch (error) {
    console.error("❌ Error fetching users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllUsers();
