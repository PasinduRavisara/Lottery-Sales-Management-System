const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Zone Managers list
const zoneManagers = [
  "G.A.R.S. Ranathunga",
  "I. D. P. Kumarasiri",
  "M.K.A.I. Kamalsiri",
  "D. M. B. L. Mahinda",
  "M.L.G. Kaushalya",
  "R. M. U. S. Kumara",
  "C.J.B. Jayawardena",
  "P. R. H. K. Chathuranga",
  "M. Thawakokulan",
];

// Field Officers list
const fieldOfficers = [
  "H.H.A.L. Caldera",
  "Muditha Bandaranayake",
  "Isuru Dasun",
  "Dilum Randika",
  "S. Seevakanth",
  "Yasitha Dasun",
  "Nimesh Hasaranga",
  "Gayan Wickramarathna",
  "Dimuthu Kariyawasam",
  "Ranjith Kariyawasam",
  "Roshan Dilruk",
  "Rohan Pinthu Jayawardena",
  "R.M. Hasitha Lasantha Kumara",
  "Indrajeewa Peiris",
  "Wathsala Siriwardena",
  "Romesh Bandara",
  "Gayan Iresh",
  "Asela Weerasinghe",
  "Charitha Madushanka",
  "Amith Herath",
  "Dasun Ariyarathna",
  "Amila Sampath",
];

// Function to extract first name for password
function extractFirstName(fullName) {
  // Remove initials and dots, get the first meaningful name
  const parts = fullName.split(" ");

  // Find the first part that doesn't contain dots (not an initial)
  for (let part of parts) {
    if (!part.includes(".") && part.length > 1) {
      return part.toLowerCase();
    }
  }

  // If all parts have dots, take the last part and remove dots
  return parts[parts.length - 1].replace(/\./g, "").toLowerCase();
}

// Function to create a user
async function createUser(fullName, role) {
  try {
    const username = fullName;
    const firstName = extractFirstName(fullName);
    const password = firstName + "123";

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      console.log(`⚠️  User already exists: ${username}`);
      return { success: false, reason: "already exists" };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role,
      },
    });

    console.log(`✅ Created ${role}: ${username} (Password: ${password})`);
    return {
      success: true,
      user: {
        username,
        password,
        role,
      },
    };
  } catch (error) {
    console.log(`❌ Error creating user ${fullName}:`, error.message);
    return { success: false, reason: error.message };
  }
}

// Main function to create all users
async function createAllUsers() {
  console.log("🚀 Starting batch user creation...\n");

  const results = {
    zoneManagers: [],
    fieldOfficers: [],
    errors: [],
  };

  console.log("📋 Creating Zone Managers...");
  for (let name of zoneManagers) {
    const result = await createUser(name, "ZONE_MANAGER");
    if (result.success) {
      results.zoneManagers.push(result.user);
    } else {
      results.errors.push({
        name,
        role: "ZONE_MANAGER",
        reason: result.reason,
      });
    }
  }

  console.log("\n📋 Creating Field Officers...");
  for (let name of fieldOfficers) {
    const result = await createUser(name, "FIELD_OFFICER");
    if (result.success) {
      results.fieldOfficers.push(result.user);
    } else {
      results.errors.push({
        name,
        role: "FIELD_OFFICER",
        reason: result.reason,
      });
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 BATCH USER CREATION SUMMARY");
  console.log("=".repeat(60));
  console.log(
    `✅ Zone Managers created: ${results.zoneManagers.length}/${zoneManagers.length}`
  );
  console.log(
    `✅ Field Officers created: ${results.fieldOfficers.length}/${fieldOfficers.length}`
  );
  console.log(`❌ Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log("\n❌ Errors encountered:");
    results.errors.forEach((error) => {
      console.log(`   - ${error.name} (${error.role}): ${error.reason}`);
    });
  }

  console.log("\n📋 All created accounts:");
  console.log("\n🏢 ZONE MANAGERS:");
  results.zoneManagers.forEach((user) => {
    console.log(`   Username: ${user.username}`);
    console.log(`   Password: ${user.password}`);
    console.log("");
  });

  console.log("👨‍💼 FIELD OFFICERS:");
  results.fieldOfficers.forEach((user) => {
    console.log(`   Username: ${user.username}`);
    console.log(`   Password: ${user.password}`);
    console.log("");
  });

  console.log("✨ Batch user creation completed!");
}

// Run the script
createAllUsers()
  .catch((error) => {
    console.error("💥 Script error:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
