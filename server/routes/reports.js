const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { Parser } = require("json2csv");
const XLSX = require("xlsx");

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
        user: { select: { id: true, username: true } },
        dailySales: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate summary statistics using pre-calculated totals
    const totalSubmissions = submissions.length;
    const totalTickets = submissions.reduce((total, submission) => {
      return total + submission.totalTickets;
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
        brandSummary[dailySale.brandName].total += dailySale.weeklyTotal;
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
        user: { select: { id: true, username: true } },
        dailySales: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Flatten data for CSV/Excel export with proper column ordering
    const exportData = [];
    submissions.forEach((submission) => {
      submission.dailySales.forEach((dailySale) => {
        exportData.push({
          "Submitted By": submission.user.username,
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
          "Weekly Total": dailySale.weeklyTotal,
          "Submission Total": submission.totalTickets,
          Date: submission.createdAt.toISOString().split("T")[0],
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
    } else if (format === "excel") {
      // Create Excel workbook with multiple sheets
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Detailed Sales Data
      const detailsSheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const detailsRange = XLSX.utils.decode_range(detailsSheet["!ref"]);
      const colWidths = [];
      for (let C = detailsRange.s.c; C <= detailsRange.e.c; ++C) {
        let maxWidth = 10;
        for (let R = detailsRange.s.r; R <= detailsRange.e.r; ++R) {
          const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
          const cell = detailsSheet[cellAddress];
          if (cell && cell.v) {
            const cellValueLength = cell.v.toString().length;
            maxWidth = Math.max(maxWidth, cellValueLength);
          }
        }
        colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
      }
      detailsSheet["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(workbook, detailsSheet, "Sales Details");

      // Sheet 2: Summary by Brand
      const brandSummary = {};
      exportData.forEach((row) => {
        if (!brandSummary[row["Brand Name"]]) {
          brandSummary[row["Brand Name"]] = {
            "Brand Name": row["Brand Name"],
            "Total Monday": 0,
            "Total Tuesday": 0,
            "Total Wednesday": 0,
            "Total Thursday": 0,
            "Total Friday": 0,
            "Total Saturday": 0,
            "Total Sunday": 0,
            "Brand Total": 0,
          };
        }
        brandSummary[row["Brand Name"]]["Total Monday"] += row.Monday;
        brandSummary[row["Brand Name"]]["Total Tuesday"] += row.Tuesday;
        brandSummary[row["Brand Name"]]["Total Wednesday"] += row.Wednesday;
        brandSummary[row["Brand Name"]]["Total Thursday"] += row.Thursday;
        brandSummary[row["Brand Name"]]["Total Friday"] += row.Friday;
        brandSummary[row["Brand Name"]]["Total Saturday"] += row.Saturday;
        brandSummary[row["Brand Name"]]["Total Sunday"] += row.Sunday;
        brandSummary[row["Brand Name"]]["Brand Total"] += row["Weekly Total"];
      });

      const brandSummaryData = Object.values(brandSummary);
      const brandSheet = XLSX.utils.json_to_sheet(brandSummaryData);
      brandSheet["!cols"] = [
        { wch: 20 }, // Brand Name
        { wch: 12 }, // Monday
        { wch: 12 }, // Tuesday
        { wch: 12 }, // Wednesday
        { wch: 12 }, // Thursday
        { wch: 12 }, // Friday
        { wch: 12 }, // Saturday
        { wch: 12 }, // Sunday
        { wch: 15 }, // Brand Total
      ];
      XLSX.utils.book_append_sheet(workbook, brandSheet, "Brand Summary");

      // Sheet 3: Summary by District
      const districtSummary = {};
      exportData.forEach((row) => {
        if (!districtSummary[row.District]) {
          districtSummary[row.District] = {
            District: row.District,
            "Total Submissions": 0,
            "Total Tickets": 0,
            "Unique Dealers": new Set(),
          };
        }
        districtSummary[row.District]["Total Tickets"] += row["Weekly Total"];
        districtSummary[row.District]["Unique Dealers"].add(row["Dealer Name"]);
      });

      // Count unique submissions per district
      const submissionsByDistrict = {};
      submissions.forEach((submission) => {
        if (!submissionsByDistrict[submission.district]) {
          submissionsByDistrict[submission.district] = 0;
        }
        submissionsByDistrict[submission.district]++;
      });

      const districtSummaryData = Object.keys(districtSummary).map(
        (district) => ({
          District: district,
          "Total Submissions": submissionsByDistrict[district] || 0,
          "Total Tickets": districtSummary[district]["Total Tickets"],
          "Unique Dealers": districtSummary[district]["Unique Dealers"].size,
        })
      );

      const districtSheet = XLSX.utils.json_to_sheet(districtSummaryData);
      districtSheet["!cols"] = [
        { wch: 20 }, // District
        { wch: 18 }, // Total Submissions
        { wch: 15 }, // Total Tickets
        { wch: 15 }, // Unique Dealers
      ];
      XLSX.utils.book_append_sheet(workbook, districtSheet, "District Summary");

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=lottery-sales-report.xlsx"
      );
      res.send(excelBuffer);
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
        user: { select: { id: true, username: true } },
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
