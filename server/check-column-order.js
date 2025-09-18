const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkColumnOrder() {
  try {
    console.log("🔍 Checking current database column order...");

    // Check sales_submissions table structure
    console.log("\n📋 Sales Submissions Table Structure:");
    const submissionsColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, ORDINAL_POSITION, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'sales_submissions'
      ORDER BY ORDINAL_POSITION
    `;

    submissionsColumns.forEach((col, index) => {
      const isTimestamp =
        col.COLUMN_NAME === "created_at" || col.COLUMN_NAME === "updated_at";
      const marker = isTimestamp ? "📅" : "📊";
      console.log(
        `   ${col.ORDINAL_POSITION}. ${marker} ${col.COLUMN_NAME} (${col.DATA_TYPE})`
      );
    });

    // Check daily_sales table structure
    console.log("\n📋 Daily Sales Table Structure:");
    const dailySalesColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, ORDINAL_POSITION, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'daily_sales'
      ORDER BY ORDINAL_POSITION
    `;

    dailySalesColumns.forEach((col, index) => {
      const isTimestamp =
        col.COLUMN_NAME === "created_at" || col.COLUMN_NAME === "updated_at";
      const marker = isTimestamp ? "📅" : "📊";
      console.log(
        `   ${col.ORDINAL_POSITION}. ${marker} ${col.COLUMN_NAME} (${col.DATA_TYPE})`
      );
    });

    // Check if timestamps are at the end
    console.log("\n🎯 Analysis:");

    // Sales Submissions Analysis
    const submissionsLastCols = submissionsColumns.slice(-2);
    const submissionsTimestampsAtEnd =
      submissionsLastCols[0].COLUMN_NAME === "created_at" &&
      submissionsLastCols[1].COLUMN_NAME === "updated_at";

    console.log(
      `   Sales Submissions: ${
        submissionsTimestampsAtEnd ? "✅" : "❌"
      } Timestamps ${submissionsTimestampsAtEnd ? "are" : "are NOT"} at the end`
    );

    // Daily Sales Analysis
    const dailySalesLastCols = dailySalesColumns.slice(-2);
    const dailySalesTimestampsAtEnd =
      dailySalesLastCols[0].COLUMN_NAME === "created_at" &&
      dailySalesLastCols[1].COLUMN_NAME === "updated_at";

    console.log(
      `   Daily Sales: ${dailySalesTimestampsAtEnd ? "✅" : "❌"} Timestamps ${
        dailySalesTimestampsAtEnd ? "are" : "are NOT"
      } at the end`
    );

    if (!submissionsTimestampsAtEnd || !dailySalesTimestampsAtEnd) {
      console.log("\n⚠️  Column reordering needed!");
      console.log(
        "   This will require creating a migration to reorder columns."
      );
    } else {
      console.log(
        "\n✅ All timestamp columns are correctly positioned at the end!"
      );
    }
  } catch (error) {
    console.error("❌ Error checking column order:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumnOrder();
