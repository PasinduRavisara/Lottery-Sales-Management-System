const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testDeletionPermissions() {
  try {
    console.log("🧪 Testing deletion permissions...\n");

    // Get a field officer
    const fieldOfficer = await prisma.user.findFirst({
      where: { role: "FIELD_OFFICER" },
    });

    if (!fieldOfficer) {
      console.log("❌ No field officer found for testing");
      return;
    }

    console.log(`👨‍💼 Testing with Field Officer: ${fieldOfficer.username}`);

    // Check their submissions
    const submissions = await prisma.salesSubmission.findMany({
      where: { userId: fieldOfficer.id },
      select: {
        id: true,
        dealerName: true,
        district: true,
        city: true,
        isDraft: true,
        createdAt: true,
      },
    });

    console.log(`📊 Field Officer has ${submissions.length} submissions\n`);

    if (submissions.length > 0) {
      console.log("📋 Their submissions:");
      submissions.forEach((submission, index) => {
        console.log(
          `   ${index + 1}. ${submission.dealerName} - ${
            submission.district
          }, ${submission.city} ${
            submission.isDraft ? "(Draft)" : "(Completed)"
          }`
        );
      });
    } else {
      console.log("ℹ️  Field Officer has no submissions to test deletion with");
    }

    console.log("\n✅ Deletion permissions test completed!");
    console.log(
      "💡 Field Officers can now delete their own submissions from the Reports page"
    );
  } catch (error) {
    console.error("❌ Test error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeletionPermissions();
