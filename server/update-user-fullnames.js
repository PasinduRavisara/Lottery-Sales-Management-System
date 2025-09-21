const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function updateUsersWithFullNames() {
  try {
    console.log("Updating users with full names...");
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true
      }
    });
    
    console.log(`Found ${users.length} users to check`);
    
    for (const user of users) {
      // If user doesn't have a fullName or it's empty, set it based on username
      if (!user.fullName || user.fullName.trim() === '') {
        let newFullName;
        
        // Map common usernames to proper full names
        switch (user.username.toLowerCase()) {
          case 'admin':
            newFullName = 'Administrator';
            break;
          case 'dilum_004':
            newFullName = 'Dilum Weerasinghe';
            break;
          default:
            // Create a full name from username (capitalize and replace underscores)
            newFullName = user.username
              .replace(/_/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
        }
        
        await prisma.user.update({
          where: { id: user.id },
          data: { fullName: newFullName }
        });
        
        console.log(`Updated user ${user.username} with fullName: ${newFullName}`);
      } else {
        console.log(`User ${user.username} already has fullName: ${user.fullName}`);
      }
    }
    
    console.log("User update completed!");
    
  } catch (error) {
    console.error("Error updating users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUsersWithFullNames();