const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkSubmissions() {
  try {
    const count = await prisma.salesSubmission.count();
    console.log(`Total submissions: ${count}`);
    
    if (count > 0) {
      const submissions = await prisma.salesSubmission.findMany({
        take: 3,
        include: {
          user: {
            select: {
              username: true,
              fullName: true
            }
          }
        }
      });
      
      console.log("\nSample submissions:");
      submissions.forEach(sub => {
        console.log(`ID: ${sub.id}, User: ${sub.user.username}, Full Name: ${sub.user.fullName}`);
      });
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubmissions();