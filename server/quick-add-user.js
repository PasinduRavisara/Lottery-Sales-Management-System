const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function addUser(username, password, role = "SALES_PROMOTION_ASSISTANT") {
  try {
    // Validate inputs
    if (!username || !password) {
      console.log("Usage: node quick-add-user.js <username> <password> [role]");
      console.log(
        "Example: node quick-add-user.js john123 password123 SALES_PROMOTION_ASSISTANT"
      );
      return;
    }

    if (password.length < 6) {
      console.log("Error: Password must be at least 6 characters");
      return;
    }

    const validRoles = ["TERRITORY_MANAGER", "SALES_PROMOTION_ASSISTANT"];
    if (!validRoles.includes(role.toUpperCase())) {
      console.log(
        "Error: Role must be TERRITORY_MANAGER or SALES_PROMOTION_ASSISTANT"
      );
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      console.log("Error: Username already exists");
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: role.toUpperCase(),
      },
    });

    console.log("✅ User created successfully!");
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt}`);
  } catch (error) {
    console.error("Error creating user:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const [username, password, role] = args;

addUser(username, password, role);
