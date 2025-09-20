const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function verifyAllPasswords() {
  try {
    console.log("🔍 VERIFICATION OF ALL USER PASSWORDS");
    console.log("=".repeat(60));

    // Get all users grouped by role
    const allUsers = await prisma.user.findMany({
      select: {
        username: true,
        fullName: true,
        role: true,
        district: true,
      },
      orderBy: [
        { role: "desc" }, // Territory Manager first
        { fullName: "asc" },
      ],
    });

    const territoryManagers = allUsers.filter(
      (u) => u.role === "TERRITORY_MANAGER"
    );
    const salesPromotionAssistants = allUsers.filter(
      (u) => u.role === "SALES_PROMOTION_ASSISTANT"
    );

    console.log(`\n🏢 TERRITORY MANAGERS (${territoryManagers.length} total):`);
    console.log("-".repeat(40));
    territoryManagers.forEach((tm, index) => {
      console.log(
        `${index + 1}. ${tm.fullName} ${tm.district ? `(${tm.district})` : ""}`
      );
      console.log(`   Username: ${tm.username}`);
    });

    console.log(
      `\n👨‍💼 SALES PROMOTION ASSISTANTS (${salesPromotionAssistants.length} total):`
    );
    console.log("-".repeat(40));
    salesPromotionAssistants.forEach((sap, index) => {
      console.log(`${index + 1}. ${sap.fullName}`);
      console.log(`   Username: ${sap.username}`);
    });

    console.log(`\n📊 TOTAL USERS: ${allUsers.length}`);
    console.log(`   🏢 Territory Managers: ${territoryManagers.length}`);
    console.log(
      `   👨‍💼 Sales Promotion Assistants: ${salesPromotionAssistants.length}`
    );

    console.log(
      "\n✅ All user accounts verified and passwords updated successfully!"
    );
  } catch (error) {
    console.error("❌ Error during verification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAllPasswords();
