const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function askPassword(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    process.stdout.write(question);
    let password = "";

    stdin.on("data", function (char) {
      char = char + "";

      switch (char) {
        case "\n":
        case "\r":
        case "\u0004":
          stdin.setRawMode(false);
          stdin.pause();
          process.stdout.write("\n");
          resolve(password);
          break;
        case "\u0003":
          process.exit();
          break;
        case "\u007f": // backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write("\b \b");
          }
          break;
        default:
          password += char;
          process.stdout.write("*");
          break;
      }
    });
  });
}

async function createUser() {
  try {
    console.log("=== Add New User ===\n");

    const username = await askQuestion("Username: ");
    if (!username.trim()) {
      console.log("Username cannot be empty");
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (existingUser) {
      console.log("Error: Username already exists");
      return;
    }

    const password = await askPassword("Password: ");
    if (password.length < 6) {
      console.log("Error: Password must be at least 6 characters");
      return;
    }

    const role = await askQuestion("Role (ADMIN/DEALER) [DEALER]: ");
    const userRole = role.toUpperCase() === "ADMIN" ? "ADMIN" : "DEALER";

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        passwordHash,
        role: userRole,
      },
    });

    console.log(`\n✅ User created successfully!`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}`);
  } catch (error) {
    console.error("Error creating user:", error.message);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Run the script
createUser();
