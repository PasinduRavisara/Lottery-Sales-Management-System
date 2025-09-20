const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Mapping of usernames to proper full names
const userNameMappings = {
  // Territory Managers
  Ranathunga: "W.M. Ranathunga",
  Kumarasiri: "K.A. Kumarasiri",
  Kamalsiri: "S. Kamalsiri",
  Mahinda: "H.M. Mahinda",
  Kaushalya: "D.M. Kaushalya",
  Kumara: "P.S. Kumara",
  Jayawardhane: "R.L. Jayawardhane",
  Chathuranga: "N.S. Chathuranga",
  Thawakokulan: "T. Thawakokulan",
  territory_demo: "Territory Demo User",

  // Sales Promotion Assistants
  "H.H.A.L. Kaldera": "H.H.A.L. Kaldera",
  "Muditha Bandaranayake": "Muditha Bandaranayake",
  "Isuru Dasun": "Isuru Dasun",
  "Dilum Randika": "Dilum Randika",
  "S. Seevakanth": "S. Seevakanth",
  "Yasitha Dasun": "Yasitha Dasun",
  "Nimesh Hasaranga": "Nimesh Hasaranga",
  "Gayan Wickramarathna": "Gayan Wickramarathna",
  "Dimuthu Kariyawasam": "Dimuthu Kariyawasam",
  "Ranjith Kariyawasam": "Ranjith Kariyawasam",
  "Roshan Dilruk": "Roshan Dilruk",
  "Rohan Pinthu Jayawardena": "Rohan Pinthu Jayawardena",
  "R.M. Hasitha Lasantha Kumara": "R.M. Hasitha Lasantha Kumara",
  "Indrajeewa Peiris": "Indrajeewa Peiris",
  "Wathsala Siriwardena": "Wathsala Siriwardena",
  "Romesh Bandara": "Romesh Bandara",
  "Gayan Iresh": "Gayan Iresh",
  "Asela Weerasinghe": "Asela Weerasinghe",
  "Charitha Madushanka": "Charitha Madushanka",
  "Amith Herath": "Amith Herath",
  "Dasun Ariyarathna": "Dasun Ariyarathna",
  "Amila Sampath": "Amila Sampath",
  Kaldera: "A.B. Kaldera",
  Muditha: "S.K. Muditha",
};

async function updateFullNames() {
  try {
    console.log("🔄 Starting to update user full names...");

    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, username: true, fullName: true, role: true },
    });

    console.log(`📊 Found ${users.length} users to process`);

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const user of users) {
      const mappedFullName = userNameMappings[user.username];

      if (mappedFullName) {
        // Update the user with the mapped full name
        await prisma.user.update({
          where: { id: user.id },
          data: { fullName: mappedFullName },
        });

        console.log(`✅ Updated: ${user.username} -> ${mappedFullName}`);
        updatedCount++;
      } else {
        // Keep the existing fullName (which should be the username from migration)
        console.log(
          `⚠️  No mapping found for: ${user.username} (keeping: ${user.fullName})`
        );
        notFoundCount++;
      }
    }

    console.log("\n📋 Summary:");
    console.log(`✅ Successfully updated: ${updatedCount} users`);
    console.log(`⚠️  No mapping found: ${notFoundCount} users`);
    console.log(`📊 Total processed: ${users.length} users`);

    // Create username mappings for users without proper full names
    if (notFoundCount > 0) {
      console.log(
        "\n💡 For users without mappings, consider updating them manually:"
      );
      const unmappedUsers = users.filter(
        (user) => !userNameMappings[user.username]
      );
      unmappedUsers.forEach((user) => {
        // Create a username suggestion
        const suggestedUsername = user.fullName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_");
        console.log(
          `   Username: "${user.fullName}" -> Suggested: "${suggestedUsername}"`
        );
      });
    }
  } catch (error) {
    console.error("❌ Error updating full names:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateFullNames();
