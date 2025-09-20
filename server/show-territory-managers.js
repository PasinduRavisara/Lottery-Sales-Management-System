const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function showTerritoryManagerDetails() {
  try {
    console.log("📋 TERRITORY MANAGER DETAILS REPORT");
    console.log("=".repeat(60));

    const territoryManagers = await prisma.user.findMany({
      where: { role: "TERRITORY_MANAGER" },
      select: {
        username: true,
        fullName: true,
        district: true,
        createdAt: true,
      },
      orderBy: { fullName: "asc" },
    });

    console.log(
      `\n🏢 TERRITORY MANAGERS (${territoryManagers.length} total):\n`
    );

    territoryManagers.forEach((tm, index) => {
      console.log(`${index + 1}. ${tm.fullName}`);
      console.log(`   Username: ${tm.username}`);
      if (tm.district) {
        console.log(`   District: ${tm.district}`);
      }
      console.log(`   Created: ${tm.createdAt.toLocaleDateString()}`);
      console.log("");
    });

    console.log("🔐 LOGIN CREDENTIALS:");
    console.log("-".repeat(40));

    const passwords = {
      ranathunga_tm: "Ranathunga@#4872",
      kumarasiri_tm: "Kumarasiri@#4881",
      kamalsiri_tm: "Kamalsiri@#4875",
      mahinda_tm: "Mahinda@#4874",
      kaushalya_tm: "Kaushalya@#4877",
      kumara_tm: "Kumara@#4880",
      jayawardhane_tm: "Jayawardhane@#7245",
      chathuranga_tm: "Chathuranga@#4892",
      thawakokulan_tm: "Thawakokulan@#4884",
    };

    territoryManagers.forEach((tm) => {
      console.log(`Username: ${tm.username}`);
      console.log(`Password: ${passwords[tm.username]}`);
      console.log(`Full Name: ${tm.fullName}\n`);
    });
  } catch (error) {
    console.error("❌ Error fetching territory manager details:", error);
  } finally {
    await prisma.$disconnect();
  }
}

showTerritoryManagerDetails();
