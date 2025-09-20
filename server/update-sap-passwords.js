const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Sales Promotion Assistants with their phone numbers and password format
const salesPromotionAssistants = [
  {
    fullName: "H.H.A.L. Kaldera",
    username: "kaldera_001",
    phone: "074-0745054",
    firstName: "Kaldera",
    password: "Kaldera@#5054",
  },
  {
    fullName: "Muditha Bandaranayake",
    username: "muditha_002",
    phone: "076-8271496",
    firstName: "Muditha",
    password: "Muditha@#1496",
  },
  {
    fullName: "Isuru Dasun",
    username: "isuru_003",
    phone: "074-0380232",
    firstName: "Isuru",
    password: "Isuru@#0232",
  },
  {
    fullName: "Dilum Randika",
    username: "dilum_004",
    phone: "076-8271497",
    firstName: "Dilum",
    password: "Dilum@#1497",
  },
  {
    fullName: "S. Seevakanth", // Note: corrected spelling from your list
    username: "seevakanth_005",
    phone: "077-1054893",
    firstName: "Sivakanth", // Using the name from your list
    password: "Sivakanth@#4893",
  },
  {
    fullName: "Yasitha Dasun",
    username: "yasitha_006",
    phone: "074-3258217",
    firstName: "Yasitha",
    password: "Yasitha@#8217",
  },
  {
    fullName: "Nimesh Hasaranga",
    username: "nimesh_007",
    phone: "074-2967371",
    firstName: "Nimesh",
    password: "Nimesh@#7371",
  },
  {
    fullName: "Gayan Wickramarathna", // Note: slight spelling difference
    username: "gayan_w_008",
    phone: "077-1054885",
    firstName: "Gayan",
    password: "Gayan@#4885",
  },
  {
    fullName: "Dimuthu Kariyawasam",
    username: "dimuthu_009",
    phone: "077-5125836",
    firstName: "Dimuthu",
    password: "Dimuthu@#5836",
  },
  {
    fullName: "Ranjith Kariyawasam",
    username: "ranjith_010",
    phone: "077-1054887",
    firstName: "Ranjith",
    password: "Ranjith@#4887",
  },
  {
    fullName: "Roshan Dilruk",
    username: "roshan_011",
    phone: "076-9889706",
    firstName: "Roshan",
    password: "Roshan@#9706",
  },
  {
    fullName: "Rohan Pinthu Jayawardena", // Note: slight spelling difference
    username: "rohan_012",
    phone: "077-0356565",
    firstName: "Rohan",
    password: "Rohan@#6565",
  },
  {
    fullName: "R.M. Hasitha Lasantha Kumara",
    username: "hasitha_013",
    phone: "076-5751463",
    firstName: "Hasitha",
    password: "Hasitha@#1463",
  },
  {
    fullName: "Indrajeewa Peiris",
    username: "indrajeewa_014",
    phone: "076-6409737",
    firstName: "Indrajeewa",
    password: "Indrajeewa@#9737",
  },
  {
    fullName: "Wathsala Siriwardena", // Note: spelling difference from your list (Siriwardhana vs Siriwardena)
    username: "wathsala_015",
    phone: "074-3871146",
    firstName: "Wathsala",
    password: "Wathsala@#1146",
  },
  {
    fullName: "Romesh Bandara",
    username: "romesh_016",
    phone: "076-8271495",
    firstName: "Romesh",
    password: "Romesh@#1495",
  },
  {
    fullName: "Gayan Iresh",
    username: "gayan_i_017",
    phone: "076-8271494",
    firstName: "Gayan",
    password: "Gayan@#1494",
  },
  {
    fullName: "Asela Weerasinghe",
    username: "asela_018",
    phone: "077-8800864",
    firstName: "Asela",
    password: "Asela@#0864",
  },
  {
    fullName: "Charitha Madushanka", // Note: spelling difference (Madhusanka vs Madushanka)
    username: "charitha_019",
    phone: "074-2607387",
    firstName: "Charitha",
    password: "Charitha@#7387",
  },
  {
    fullName: "Amith Herath",
    username: "amith_020",
    phone: "076-3162429",
    firstName: "Amith",
    password: "Amith@#2429",
  },
  {
    fullName: "Dasun Ariyarathna",
    username: "dasun_021",
    phone: "077-1054889",
    firstName: "Dasun",
    password: "Dasun@#4889",
  },
  {
    fullName: "Amila Sampath",
    username: "amila_022",
    phone: "076-0350827",
    firstName: "Amila",
    password: "Amila@#0827",
  },
];

async function updateSAPPasswords() {
  try {
    console.log("🔄 Starting Sales Promotion Assistant password update...");
    console.log(
      `📊 Planning to update ${salesPromotionAssistants.length} users\n`
    );

    let updatedCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    for (const sap of salesPromotionAssistants) {
      try {
        // Find user by username
        const user = await prisma.user.findUnique({
          where: { username: sap.username },
        });

        if (user) {
          // Hash the new password
          const hashedPassword = await bcrypt.hash(sap.password, 10);

          // Update the user's password
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword },
          });

          console.log(`✅ ${sap.username} -> ${sap.fullName}`);
          console.log(`   📞 Phone: ${sap.phone} -> Password: ${sap.password}`);
          updatedCount++;
        } else {
          console.log(`⚠️  User not found: ${sap.username} (${sap.fullName})`);
          notFoundCount++;
        }
      } catch (error) {
        console.log(`❌ Error updating ${sap.username}:`, error.message);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📋 PASSWORD UPDATE SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successfully updated: ${updatedCount} users`);
    console.log(`⚠️  Users not found: ${notFoundCount} users`);
    console.log(`❌ Errors encountered: ${errorCount} users`);
    console.log(`📊 Total processed: ${salesPromotionAssistants.length} users`);

    console.log("\n🔐 NEW LOGIN CREDENTIALS FOR SALES PROMOTION ASSISTANTS:");
    console.log("-".repeat(60));

    salesPromotionAssistants.forEach((sap) => {
      console.log(`Username: ${sap.username}`);
      console.log(`Password: ${sap.password}`);
      console.log(`Full Name: ${sap.fullName}`);
      console.log(`Phone: ${sap.phone}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error updating SAP passwords:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSAPPasswords();
