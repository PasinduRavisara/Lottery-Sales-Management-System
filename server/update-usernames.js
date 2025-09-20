const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Mapping of current usernames (which are full names) to proper usernames
const usernameUpdates = [
  // Sales Promotion Assistants - need username updates
  {
    currentUsername: "H.H.A.L. Kaldera",
    newUsername: "kaldera_001",
    fullName: "H.H.A.L. Kaldera",
  },
  {
    currentUsername: "Muditha Bandaranayake",
    newUsername: "muditha_002",
    fullName: "Muditha Bandaranayake",
  },
  {
    currentUsername: "Isuru Dasun",
    newUsername: "isuru_003",
    fullName: "Isuru Dasun",
  },
  {
    currentUsername: "Dilum Randika",
    newUsername: "dilum_004",
    fullName: "Dilum Randika",
  },
  {
    currentUsername: "S. Seevakanth",
    newUsername: "seevakanth_005",
    fullName: "S. Seevakanth",
  },
  {
    currentUsername: "Yasitha Dasun",
    newUsername: "yasitha_006",
    fullName: "Yasitha Dasun",
  },
  {
    currentUsername: "Nimesh Hasaranga",
    newUsername: "nimesh_007",
    fullName: "Nimesh Hasaranga",
  },
  {
    currentUsername: "Gayan Wickramarathna",
    newUsername: "gayan_w_008",
    fullName: "Gayan Wickramarathna",
  },
  {
    currentUsername: "Dimuthu Kariyawasam",
    newUsername: "dimuthu_009",
    fullName: "Dimuthu Kariyawasam",
  },
  {
    currentUsername: "Ranjith Kariyawasam",
    newUsername: "ranjith_010",
    fullName: "Ranjith Kariyawasam",
  },
  {
    currentUsername: "Roshan Dilruk",
    newUsername: "roshan_011",
    fullName: "Roshan Dilruk",
  },
  {
    currentUsername: "Rohan Pinthu Jayawardena",
    newUsername: "rohan_012",
    fullName: "Rohan Pinthu Jayawardena",
  },
  {
    currentUsername: "R.M. Hasitha Lasantha Kumara",
    newUsername: "hasitha_013",
    fullName: "R.M. Hasitha Lasantha Kumara",
  },
  {
    currentUsername: "Indrajeewa Peiris",
    newUsername: "indrajeewa_014",
    fullName: "Indrajeewa Peiris",
  },
  {
    currentUsername: "Wathsala Siriwardena",
    newUsername: "wathsala_015",
    fullName: "Wathsala Siriwardena",
  },
  {
    currentUsername: "Romesh Bandara",
    newUsername: "romesh_016",
    fullName: "Romesh Bandara",
  },
  {
    currentUsername: "Gayan Iresh",
    newUsername: "gayan_i_017",
    fullName: "Gayan Iresh",
  },
  {
    currentUsername: "Asela Weerasinghe",
    newUsername: "asela_018",
    fullName: "Asela Weerasinghe",
  },
  {
    currentUsername: "Charitha Madushanka",
    newUsername: "charitha_019",
    fullName: "Charitha Madushanka",
  },
  {
    currentUsername: "Amith Herath",
    newUsername: "amith_020",
    fullName: "Amith Herath",
  },
  {
    currentUsername: "Dasun Ariyarathna",
    newUsername: "dasun_021",
    fullName: "Dasun Ariyarathna",
  },
  {
    currentUsername: "Amila Sampath",
    newUsername: "amila_022",
    fullName: "Amila Sampath",
  },

  // Territory Managers - update to have proper usernames
  {
    currentUsername: "Ranathunga",
    newUsername: "ranathunga_tm",
    fullName: "W.M. Ranathunga",
  },
  {
    currentUsername: "Kumarasiri",
    newUsername: "kumarasiri_tm",
    fullName: "K.A. Kumarasiri",
  },
  {
    currentUsername: "Kamalsiri",
    newUsername: "kamalsiri_tm",
    fullName: "S. Kamalsiri",
  },
  {
    currentUsername: "Mahinda",
    newUsername: "mahinda_tm",
    fullName: "H.M. Mahinda",
  },
  {
    currentUsername: "Kaushalya",
    newUsername: "kaushalya_tm",
    fullName: "D.M. Kaushalya",
  },
  {
    currentUsername: "Kumara",
    newUsername: "kumara_tm",
    fullName: "P.S. Kumara",
  },
  {
    currentUsername: "Jayawardhane",
    newUsername: "jayawardhane_tm",
    fullName: "R.L. Jayawardhane",
  },
  {
    currentUsername: "Chathuranga",
    newUsername: "chathuranga_tm",
    fullName: "N.S. Chathuranga",
  },
  {
    currentUsername: "Thawakokulan",
    newUsername: "thawakokulan_tm",
    fullName: "T. Thawakokulan",
  },
];

async function updateUsernames() {
  try {
    console.log("🔄 Starting to update usernames...");
    console.log(`📊 Planning to update ${usernameUpdates.length} users`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const update of usernameUpdates) {
      try {
        // Check if user exists with current username
        const user = await prisma.user.findUnique({
          where: { username: update.currentUsername },
        });

        if (user) {
          // Check if new username already exists
          const existingUser = await prisma.user.findUnique({
            where: { username: update.newUsername },
          });

          if (existingUser) {
            console.log(
              `⚠️  Username "${update.newUsername}" already exists, skipping ${update.currentUsername}`
            );
            continue;
          }

          // Update the user
          await prisma.user.update({
            where: { id: user.id },
            data: {
              username: update.newUsername,
              fullName: update.fullName,
            },
          });

          console.log(
            `✅ Updated: "${update.currentUsername}" -> "${update.newUsername}" (${update.fullName})`
          );
          updatedCount++;
        } else {
          console.log(`⚠️  User not found: ${update.currentUsername}`);
        }
      } catch (error) {
        console.log(
          `❌ Error updating ${update.currentUsername}:`,
          error.message
        );
        errorCount++;
      }
    }

    console.log("\n📋 Summary:");
    console.log(`✅ Successfully updated: ${updatedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log(`📊 Total planned: ${usernameUpdates.length} users`);

    // Show updated list
    console.log("\n👥 Updated Username List:");
    console.log("Territory Managers:");
    usernameUpdates
      .filter((u) => u.newUsername.includes("_tm"))
      .forEach((u) => {
        console.log(`   ${u.newUsername} -> ${u.fullName}`);
      });

    console.log("\nSales Promotion Assistants:");
    usernameUpdates
      .filter(
        (u) => !u.newUsername.includes("_tm") && !u.newUsername.includes("demo")
      )
      .forEach((u) => {
        console.log(`   ${u.newUsername} -> ${u.fullName}`);
      });
  } catch (error) {
    console.error("❌ Error updating usernames:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUsernames();
