const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { Parser } = require("json2csv");

const router = express.Router();
const prisma = new PrismaClient();

// Get sales summary reports
router.get("/summary", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, district, city } = req.query;

    let whereClause = { isDraft: false }; // Only completed submissions

    // Date range filter
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Location filters
    if (district) {
      whereClause.district = { contains: district, mode: "insensitive" };
    }
    if (city) {
      whereClause.city = { contains: city, mode: "insensitive" };
    }

    // If user is sales promotion assistant, only show their submissions
    if (req.user.role === "SALES_PROMOTION_ASSISTANT") {
      whereClause.userId = req.user.id;
    }
    // Territory managers can see all submissions

    const submissions = await prisma.salesSubmission.findMany({
      where: whereClause,
      include: {
        user: { select: { username: true } },
        dailySales: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate summary statistics
    const totalSubmissions = submissions.length;
    const totalTickets = submissions.reduce((total, submission) => {
      return (
        total +
        submission.dailySales.reduce((subTotal, dailySale) => {
          return (
            subTotal +
            dailySale.monday +
            dailySale.tuesday +
            dailySale.wednesday +
            dailySale.thursday +
            dailySale.friday +
            dailySale.saturday +
            dailySale.sunday
          );
        }, 0)
      );
    }, 0);

    // Brand-wise summary
    const brandSummary = {};
    submissions.forEach((submission) => {
      submission.dailySales.forEach((dailySale) => {
        if (!brandSummary[dailySale.brandName]) {
          brandSummary[dailySale.brandName] = {
            monday: 0,
            tuesday: 0,
            wednesday: 0,
            thursday: 0,
            friday: 0,
            saturday: 0,
            sunday: 0,
            total: 0,
          };
        }

        brandSummary[dailySale.brandName].monday += dailySale.monday;
        brandSummary[dailySale.brandName].tuesday += dailySale.tuesday;
        brandSummary[dailySale.brandName].wednesday += dailySale.wednesday;
        brandSummary[dailySale.brandName].thursday += dailySale.thursday;
        brandSummary[dailySale.brandName].friday += dailySale.friday;
        brandSummary[dailySale.brandName].saturday += dailySale.saturday;
        brandSummary[dailySale.brandName].sunday += dailySale.sunday;
        brandSummary[dailySale.brandName].total +=
          dailySale.monday +
          dailySale.tuesday +
          dailySale.wednesday +
          dailySale.thursday +
          dailySale.friday +
          dailySale.saturday +
          dailySale.sunday;
      });
    });

    // District and city summary
    const locationSummary = {};
    submissions.forEach((submission) => {
      const key = `${submission.district}, ${submission.city}`;
      if (!locationSummary[key]) {
        locationSummary[key] = {
          district: submission.district,
          city: submission.city,
          submissions: 0,
          totalTickets: 0,
        };
      }
      locationSummary[key].submissions++;
      locationSummary[key].totalTickets += submission.dailySales.reduce(
        (total, dailySale) => {
          return (
            total +
            dailySale.monday +
            dailySale.tuesday +
            dailySale.wednesday +
            dailySale.thursday +
            dailySale.friday +
            dailySale.saturday +
            dailySale.sunday
          );
        },
        0
      );
    });

    res.json({
      summary: {
        totalSubmissions,
        totalTickets,
        dateRange: { startDate, endDate },
        filters: { district, city },
      },
      brandSummary,
      locationSummary: Object.values(locationSummary),
      submissions: submissions.slice(0, 50), // Limit to recent 50 for performance
    });
  } catch (error) {
    console.error("Get summary error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Export data as CSV
router.get("/export", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, district, city, format = "csv" } = req.query;

    let whereClause = { isDraft: false };

    // Date range filter
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Location filters
    if (district) {
      whereClause.district = { contains: district, mode: "insensitive" };
    }
    if (city) {
      whereClause.city = { contains: city, mode: "insensitive" };
    }

    // If user is sales promotion assistant, only show their submissions
    if (req.user.role === "SALES_PROMOTION_ASSISTANT") {
      whereClause.userId = req.user.id;
    }
    // Territory managers can see all submissions

    const submissions = await prisma.salesSubmission.findMany({
      where: whereClause,
      include: {
        user: { select: { username: true } },
        dailySales: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Flatten data for CSV export
    const exportData = [];
    submissions.forEach((submission) => {
      submission.dailySales.forEach((dailySale) => {
        exportData.push({
          "Submission ID": submission.id,
          Date: submission.createdAt.toISOString().split("T")[0],
          District: submission.district,
          City: submission.city,
          "Dealer Name": submission.dealerName,
          "Dealer Number": submission.dealerNumber,
          "Assistant Name": submission.assistantName,
          "Sales Method": submission.salesMethod,
          "Sales Location": submission.salesLocation,
          "Brand Name": dailySale.brandName,
          Monday: dailySale.monday,
          Tuesday: dailySale.tuesday,
          Wednesday: dailySale.wednesday,
          Thursday: dailySale.thursday,
          Friday: dailySale.friday,
          Saturday: dailySale.saturday,
          Sunday: dailySale.sunday,
          Total:
            dailySale.monday +
            dailySale.tuesday +
            dailySale.wednesday +
            dailySale.thursday +
            dailySale.friday +
            dailySale.saturday +
            dailySale.sunday,
          "Submitted By": submission.user.username,
        });
      });
    });

    if (format === "csv") {
      const parser = new Parser();
      const csv = parser.parse(exportData);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=lottery-sales-report.csv"
      );
      res.send(csv);
    } else {
      res.json(exportData);
    }
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get dashboard statistics
router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(
      today.setDate(today.getDate() - today.getDay())
    );
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    let whereClause = { isDraft: false };

    // If user is sales promotion assistant, only show their submissions
    if (req.user.role === "SALES_PROMOTION_ASSISTANT") {
      whereClause.userId = req.user.id;
    }
    // Territory managers can see all submissions

    // Total submissions
    const totalSubmissions = await prisma.salesSubmission.count({
      where: whereClause,
    });

    // This week's submissions
    const thisWeekSubmissions = await prisma.salesSubmission.count({
      where: {
        ...whereClause,
        createdAt: { gte: startOfWeek },
      },
    });

    // This month's submissions
    const thisMonthSubmissions = await prisma.salesSubmission.count({
      where: {
        ...whereClause,
        createdAt: { gte: startOfMonth },
      },
    });

    // Draft submissions
    const draftSubmissions = await prisma.salesSubmission.count({
      where: {
        ...whereClause,
        isDraft: true,
      },
    });

    // Recent submissions
    const recentSubmissions = await prisma.salesSubmission.findMany({
      where: whereClause,
      include: {
        user: { select: { username: true } },
        dailySales: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    res.json({
      stats: {
        totalSubmissions,
        thisWeekSubmissions,
        thisMonthSubmissions,
        draftSubmissions,
      },
      recentSubmissions,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
