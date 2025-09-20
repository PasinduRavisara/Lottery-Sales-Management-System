const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanupUnwantedUsers() {
  try {
    console.log("🔄 Checking for unwanted users to remove...");

    // List of users to remove (demo users, etc.)
    const usersToRemove = ["territory_demo"];

    for (const username of usersToRemove) {
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (user) {
        await prisma.user.delete({
          where: { id: user.id },
        });
        console.log(`❌ Removed demo user: ${username} (${user.fullName})`);
      } else {
        console.log(`ℹ️  User ${username} not found (already removed)`);
      }
    }

    // Final count
    const finalCount = await prisma.user.groupBy({
      by: ["role"],
      _count: {
        role: true,
      },
    });

    console.log("\n📊 Final user counts:");
    finalCount.forEach((group) => {
      console.log(`   ${group.role}: ${group._count.role} users`);
    });
  } catch (error) {
    console.error("❌ Error cleaning up users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupUnwantedUsers();
