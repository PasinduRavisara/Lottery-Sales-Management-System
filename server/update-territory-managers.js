const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Exact territory managers as specified by the user
const correctTerritoryManagers = [
  {
    username: "ranathunga_tm",
    fullName: "G.A.R.S. Ranathunga",
    password: "Ranathunga@#4872",
    district: "Colombo",
  },
  {
    username: "kumarasiri_tm",
    fullName: "I. D. P. Kumarasiri",
    password: "Kumarasiri@#4881",
    district: null,
  },
  {
    username: "kamalsiri_tm",
    fullName: "M.K.A.I. Kamalsiri",
    password: "Kamalsiri@#4875",
    district: null,
  },
  {
    username: "mahinda_tm",
    fullName: "D. M. B. L. Mahinda",
    password: "Mahinda@#4874",
    district: null,
  },
  {
    username: "kaushalya_tm",
    fullName: "M.L.G. Kaushalya",
    password: "Kaushalya@#4877",
    district: null,
  },
  {
    username: "kumara_tm",
    fullName: "R. M. U. S. Kumara",
    password: "Kumara@#4880",
    district: null,
  },
  {
    username: "jayawardhane_tm",
    fullName: "C.J.B. Jayawardena",
    password: "Jayawardhane@#7245",
    district: null,
  },
  {
    username: "chathuranga_tm",
    fullName: "P. R. H. K. Chathuranga",
    password: "Chathuranga@#4892",
    district: null,
  },
  {
    username: "thawakokulan_tm",
    fullName: "M. Thawakokulan",
    password: "Thawakokulan@#4884",
    district: null,
  },
];

async function updateTerritoryManagers() {
  try {
    console.log("🔄 Starting territory manager cleanup and update...");

    // Step 1: Get all current territory managers
    const currentTerritoryManagers = await prisma.user.findMany({
      where: { role: "TERRITORY_MANAGER" },
      select: { id: true, username: true, fullName: true },
    });

    console.log(
      `📊 Found ${currentTerritoryManagers.length} current territory managers`
    );

    // Step 2: Find territory managers to remove (not in the correct list)
    const correctUsernames = correctTerritoryManagers.map((tm) => tm.username);
    const managersToRemove = currentTerritoryManagers.filter(
      (tm) => !correctUsernames.includes(tm.username)
    );

    // Step 3: Remove extra territory managers
    if (managersToRemove.length > 0) {
      console.log(
        `\n🗑️  Removing ${managersToRemove.length} extra territory managers:`
      );
      for (const manager of managersToRemove) {
        await prisma.user.delete({ where: { id: manager.id } });
        console.log(`   ❌ Removed: ${manager.username} (${manager.fullName})`);
      }
    }

    // Step 4: Update or create correct territory managers
    console.log(`\n✏️  Updating territory managers with correct data:`);
    let updatedCount = 0;
    let createdCount = 0;

    for (const correctTM of correctTerritoryManagers) {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { username: correctTM.username },
      });

      // Hash the password
      const hashedPassword = await bcrypt.hash(correctTM.password, 10);

      if (existingUser) {
        // Update existing user
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            fullName: correctTM.fullName,
            passwordHash: hashedPassword,
            district: correctTM.district,
            role: "TERRITORY_MANAGER",
          },
        });
        console.log(
          `   ✅ Updated: ${correctTM.username} -> ${correctTM.fullName}`
        );
        updatedCount++;
      } else {
        // Create new user
        await prisma.user.create({
          data: {
            username: correctTM.username,
            fullName: correctTM.fullName,
            passwordHash: hashedPassword,
            district: correctTM.district,
            role: "TERRITORY_MANAGER",
          },
        });
        console.log(
          `   ➕ Created: ${correctTM.username} -> ${correctTM.fullName}`
        );
        createdCount++;
      }
    }

    // Step 5: Verify final state
    const finalTerritoryManagers = await prisma.user.findMany({
      where: { role: "TERRITORY_MANAGER" },
      select: { username: true, fullName: true, district: true },
      orderBy: { username: "asc" },
    });

    console.log(
      `\n📋 Final Territory Manager List (${finalTerritoryManagers.length} total):`
    );
    finalTerritoryManagers.forEach((tm, index) => {
      console.log(
        `   ${index + 1}. ${tm.username} -> ${tm.fullName} ${
          tm.district ? `(${tm.district})` : ""
        }`
      );
    });

    console.log(`\n📊 Summary:`);
    console.log(`   ❌ Removed: ${managersToRemove.length} users`);
    console.log(`   ✅ Updated: ${updatedCount} users`);
    console.log(`   ➕ Created: ${createdCount} users`);
    console.log(
      `   🎯 Total Territory Managers: ${finalTerritoryManagers.length}`
    );

    console.log(`\n🔐 Login Credentials:`);
    correctTerritoryManagers.forEach((tm) => {
      console.log(`   Username: ${tm.username} | Password: ${tm.password}`);
    });
  } catch (error) {
    console.error("❌ Error updating territory managers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTerritoryManagers();
