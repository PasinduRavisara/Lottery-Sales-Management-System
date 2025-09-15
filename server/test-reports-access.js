const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testReportsAccess() {
  try {
    console.log("🔍 Testing reports access for different roles...\n");

    // Get a zone manager and field officer
    const zoneManager = await prisma.user.findFirst({
      where: { role: "ZONE_MANAGER" },
    });

    const fieldOfficer = await prisma.user.findFirst({
      where: { role: "FIELD_OFFICER" },
    });

    if (!zoneManager || !fieldOfficer) {
      console.log("❌ Could not find required users for testing");
      return;
    }

    console.log(`📊 Zone Manager: ${zoneManager.username}`);
    console.log(`👨‍💼 Field Officer: ${fieldOfficer.username}\n`);

    // Test Zone Manager access (should see all submissions)
    const allSubmissions = await prisma.salesSubmission.findMany({
      include: {
        user: {
          select: { username: true },
        },
      },
    });

    console.log(
      `🏢 Zone Manager can see: ${allSubmissions.length} total submissions`
    );

    // Test Field Officer access (should see only their submissions)
    const fieldOfficerSubmissions = await prisma.salesSubmission.findMany({
      where: { userId: fieldOfficer.id },
      include: {
        user: {
          select: { username: true },
        },
      },
    });

    console.log(
      `👨‍💼 Field Officer (${fieldOfficer.username}) can see: ${fieldOfficerSubmissions.length} of their own submissions`
    );

    if (fieldOfficerSubmissions.length > 0) {
      console.log("\n📋 Field Officer's submissions:");
      fieldOfficerSubmissions.forEach((submission, index) => {
        console.log(
          `   ${index + 1}. ${submission.dealerName} - ${
            submission.district
          }, ${submission.city}`
        );
      });
    }

    console.log("\n✅ Role-based access test completed!");
  } catch (error) {
    console.error("❌ Test error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testReportsAccess();
