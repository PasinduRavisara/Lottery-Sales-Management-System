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

    const zoneManagers = users.filter((u) => u.role === "ZONE_MANAGER");
    const fieldOfficers = users.filter((u) => u.role === "FIELD_OFFICER");

    console.log("=".repeat(60));
    console.log("👥 CURRENT USERS IN DATABASE");
    console.log("=".repeat(60));
    console.log(`Total Users: ${users.length}`);
    console.log(`Zone Managers: ${zoneManagers.length}`);
    console.log(`Field Officers: ${fieldOfficers.length}`);
    console.log("");

    if (zoneManagers.length > 0) {
      console.log("🏢 ZONE MANAGERS:");
      zoneManagers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username}`);
      });
      console.log("");
    }

    if (fieldOfficers.length > 0) {
      console.log("👨‍💼 FIELD OFFICERS:");
      fieldOfficers.forEach((user, index) => {
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
