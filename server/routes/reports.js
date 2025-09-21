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
        user: { select: { id: true, username: true, fullName: true } },
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
        user: { select: { id: true, username: true, fullName: true } },
        dailySales: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Restructure data for matrix format with brands as sub-columns under each day
    const exportData = [];

    // Define lottery brands (matching frontend constants)
    const LOTTERY_BRANDS = [
      "Supiri Dhana Sampatha",
      "Ada Kotipathi",
      "Lagna Wasanawe",
      "Super Ball",
      "Shanida",
      "Kapruka",
      "Jayoda",
      "Sasiri",
      "Jaya Sampatha",
    ];

    const DAYS_OF_WEEK = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    submissions.forEach((submission) => {
      // Create a single row per submission with all brands as sub-columns
      const rowData = {
        "Submitted By": submission.user.fullName || submission.user.username,
        District: submission.district,
        City: submission.city,
        "Dealer Name": submission.dealerName,
        "Dealer Number": submission.dealerNumber,
        "Assistant Name": submission.assistantName,
        "Sales Method": submission.salesMethod,
        "Sales Location": submission.salesLocation,
      };

      // Create a map of daily sales by brand name for easy lookup
      const salesByBrand = {};
      submission.dailySales.forEach((dailySale) => {
        salesByBrand[dailySale.brandName] = dailySale;
      });

      // Add columns for each day with brand names only (for multi-level headers)
      DAYS_OF_WEEK.forEach((day) => {
        LOTTERY_BRANDS.forEach((brand) => {
          // Use just brand name as column header - day grouping will be handled by merged cells
          const columnName = `${day}_${brand}`;
          const dailySale = salesByBrand[brand];
          if (dailySale) {
            rowData[columnName] = dailySale[day.toLowerCase()];
          } else {
            rowData[columnName] = 0;
          }
        });

        // Add day total column
        const dayTotal = LOTTERY_BRANDS.reduce((total, brand) => {
          const dailySale = salesByBrand[brand];
          return total + (dailySale ? dailySale[day.toLowerCase()] : 0);
        }, 0);
        rowData[`${day}_Total`] = dayTotal;
      });

      // Add overall total
      const overallTotal = submission.dailySales.reduce((total, dailySale) => {
        return total + dailySale.weeklyTotal;
      }, 0);
      rowData["Weekly Total"] = overallTotal;

      // Add created and updated dates as last columns
      rowData["Created Date"] = submission.createdAt
        .toISOString()
        .split("T")[0];
      rowData["Updated Date"] = submission.updatedAt
        .toISOString()
        .split("T")[0];

      exportData.push(rowData);
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

      // Create worksheet manually to support multi-level headers
      const worksheet = {};

      // Define the structure
      const basicInfoCols = [
        "Submitted By",
        "District",
        "City",
        "Dealer Name",
        "Dealer Number",
        "Assistant Name",
        "Sales Method",
        "Sales Location",
      ];
      const totalCols =
        8 + DAYS_OF_WEEK.length * (LOTTERY_BRANDS.length + 1) + 3; // +1 for day total, +3 for weekly total, created date, and updated date

      // Create multi-level headers
      let currentCol = 0;

      // Day headers with merged cells
      const merges = [];

      // Header styling (center aligned)
      const headerStyle = {
        alignment: {
          horizontal: "center",
          vertical: "center",
        },
        font: {
          bold: true,
        },
      };

      // Number styling (no decimals for ticket counts)
      const numberStyle = {
        numFmt: "0", // Format as whole number (no decimals)
      };

      // Basic info headers (Row 1 and 2) - merge vertically
      basicInfoCols.forEach((header, index) => {
        const cellAddress1 = XLSX.utils.encode_cell({ r: 0, c: currentCol });
        worksheet[cellAddress1] = {
          v: header,
          t: "s",
          s: headerStyle,
        };

        // Add vertical merge for basic info columns (merge row 0 and row 1)
        merges.push({
          s: { r: 0, c: currentCol },
          e: { r: 1, c: currentCol },
        });

        currentCol++;
      });

      DAYS_OF_WEEK.forEach((day) => {
        // Create day header spanning across all brand columns + total column
        const startCol = currentCol;
        const endCol = currentCol + LOTTERY_BRANDS.length; // +1 for total column, but -1 because endCol is inclusive

        // Day name in first row (merged across all brand columns + total)
        const dayHeaderCell = XLSX.utils.encode_cell({ r: 0, c: startCol });
        worksheet[dayHeaderCell] = {
          v: day,
          t: "s",
          s: headerStyle,
        };

        // Add horizontal merge range for day header
        merges.push({
          s: { r: 0, c: startCol },
          e: { r: 0, c: endCol },
        });

        // Brand names in second row
        LOTTERY_BRANDS.forEach((brand) => {
          const brandHeaderCell = XLSX.utils.encode_cell({
            r: 1,
            c: currentCol,
          });
          worksheet[brandHeaderCell] = {
            v: brand,
            t: "s",
            s: headerStyle,
          };
          currentCol++;
        });

        // Day total column
        const totalHeaderCell = XLSX.utils.encode_cell({ r: 1, c: currentCol });
        worksheet[totalHeaderCell] = {
          v: "Total",
          t: "s",
          s: headerStyle,
        };
        currentCol++;
      });

      // Weekly Total, Created Date, and Updated Date headers - merge vertically
      ["Weekly Total", "Created Date", "Updated Date"].forEach((header) => {
        const cellAddress1 = XLSX.utils.encode_cell({ r: 0, c: currentCol });
        worksheet[cellAddress1] = {
          v: header,
          t: "s",
          s: headerStyle,
        };

        // Add vertical merge for final columns (merge row 0 and row 1)
        merges.push({
          s: { r: 0, c: currentCol },
          e: { r: 1, c: currentCol },
        });

        currentCol++;
      });

      // Add data rows starting from row 3 (index 2)
      exportData.forEach((rowData, rowIndex) => {
        let colIndex = 0;

        // Basic info columns
        basicInfoCols.forEach((col) => {
          const cellAddress = XLSX.utils.encode_cell({
            r: rowIndex + 2,
            c: colIndex,
          });
          worksheet[cellAddress] = {
            v: rowData[col] || "",
            t: typeof rowData[col] === "number" ? "n" : "s",
          };
          colIndex++;
        });

        // Day-brand matrix
        DAYS_OF_WEEK.forEach((day) => {
          LOTTERY_BRANDS.forEach((brand) => {
            const cellAddress = XLSX.utils.encode_cell({
              r: rowIndex + 2,
              c: colIndex,
            });
            const value = rowData[`${day}_${brand}`] || 0;
            worksheet[cellAddress] = {
              v: value,
              t: "n",
              s: numberStyle,
            };
            colIndex++;
          });

          // Day total
          const cellAddress = XLSX.utils.encode_cell({
            r: rowIndex + 2,
            c: colIndex,
          });
          const value = rowData[`${day}_Total`] || 0;
          worksheet[cellAddress] = {
            v: value,
            t: "n",
            s: numberStyle,
          };
          colIndex++;
        });

        // Weekly total, created date, and updated date
        const weeklyTotalCell = XLSX.utils.encode_cell({
          r: rowIndex + 2,
          c: colIndex,
        });
        worksheet[weeklyTotalCell] = {
          v: rowData["Weekly Total"] || 0,
          t: "n",
          s: numberStyle,
        };
        colIndex++;

        const createdDateCell = XLSX.utils.encode_cell({
          r: rowIndex + 2,
          c: colIndex,
        });
        worksheet[createdDateCell] = {
          v: rowData["Created Date"] || "",
          t: "s",
        };
        colIndex++;

        const updatedDateCell = XLSX.utils.encode_cell({
          r: rowIndex + 2,
          c: colIndex,
        });
        worksheet[updatedDateCell] = {
          v: rowData["Updated Date"] || "",
          t: "s",
        };
      });

      // Set worksheet range
      const lastRow = exportData.length + 1; // +2 for headers -1 for 0-based indexing
      const lastCol = currentCol - 1;
      worksheet["!ref"] = `A1:${XLSX.utils.encode_col(lastCol)}${lastRow + 1}`;

      // Add merges
      worksheet["!merges"] = merges;

      // Set column widths to accommodate header content
      const colWidths = [];
      const basicInfoWidths = [15, 12, 12, 15, 15, 15, 15, 15]; // Adjusted for header lengths

      for (let i = 0; i <= lastCol; i++) {
        if (i < 8) {
          // Basic info columns - use specific widths for each column
          colWidths.push({ wch: basicInfoWidths[i] });
        } else if (i >= lastCol - 2) {
          // Weekly Total, Created Date, and Updated Date - wider for these headers
          if (i === lastCol - 2) {
            colWidths.push({ wch: 15 }); // Weekly Total
          } else if (i === lastCol - 1) {
            colWidths.push({ wch: 12 }); // Created Date
          } else {
            colWidths.push({ wch: 12 }); // Updated Date
          }
        } else {
          // Brand and total columns - narrower for brand values (just numbers)
          const colInDay = (i - 8) % (LOTTERY_BRANDS.length + 1);
          if (colInDay === LOTTERY_BRANDS.length) {
            // Day total column
            colWidths.push({ wch: 10 });
          } else {
            // Brand columns - narrower since they only contain numeric values
            colWidths.push({ wch: 8 });
          }
        }
      }
      worksheet["!cols"] = colWidths;

      // Add freeze panes (freeze first 8 columns + 2 header rows)
      worksheet["!freeze"] = { xSplit: 8, ySplit: 2 };

      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Details");

      // Sheet 2: Summary by Brand
      const brandSummary = {};

      // Initialize brand summary with all brands
      LOTTERY_BRANDS.forEach((brand) => {
        brandSummary[brand] = {
          "Brand Name": brand,
          "Total Monday": 0,
          "Total Tuesday": 0,
          "Total Wednesday": 0,
          "Total Thursday": 0,
          "Total Friday": 0,
          "Total Saturday": 0,
          "Total Sunday": 0,
          "Brand Total": 0,
        };
      });

      // Calculate totals from the new matrix format
      exportData.forEach((row) => {
        LOTTERY_BRANDS.forEach((brand) => {
          DAYS_OF_WEEK.forEach((day) => {
            const columnName = `${day}_${brand}`;
            const value = row[columnName] || 0;
            brandSummary[brand][`Total ${day}`] += value;
            brandSummary[brand]["Brand Total"] += value;
          });
        });
      });

      const brandSummaryData = Object.values(brandSummary);
      const brandSheet = XLSX.utils.json_to_sheet(brandSummaryData);

      // Format Brand Summary as Excel Table
      if (brandSummaryData.length > 0) {
        const brandRange = XLSX.utils.decode_range(brandSheet["!ref"]);
        const brandTableRange = `A1:${XLSX.utils.encode_col(brandRange.e.c)}${
          brandRange.e.r + 1
        }`;
        brandSheet["!tables"] = [
          {
            ref: brandTableRange,
            name: "BrandSummary",
            headerRowCount: 1,
            totalsRowCount: 0,
            style: {
              theme: "TableStyleMedium3",
              showFirstColumn: false,
              showLastColumn: false,
              showRowStripes: true,
              showColumnStripes: false,
            },
          },
        ];
      }

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

      // Add freeze panes for Brand Summary
      brandSheet["!freeze"] = { xSplit: 0, ySplit: 1 };

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

      // Format District Summary as Excel Table
      if (districtSummaryData.length > 0) {
        const districtRange = XLSX.utils.decode_range(districtSheet["!ref"]);
        const districtTableRange = `A1:${XLSX.utils.encode_col(
          districtRange.e.c
        )}${districtRange.e.r + 1}`;
        districtSheet["!tables"] = [
          {
            ref: districtTableRange,
            name: "DistrictSummary",
            headerRowCount: 1,
            totalsRowCount: 0,
            style: {
              theme: "TableStyleMedium4",
              showFirstColumn: false,
              showLastColumn: false,
              showRowStripes: true,
              showColumnStripes: false,
            },
          },
        ];
      }

      districtSheet["!cols"] = [
        { wch: 20 }, // District
        { wch: 18 }, // Total Submissions
        { wch: 15 }, // Total Tickets
        { wch: 15 }, // Unique Dealers
      ];

      // Add freeze panes for District Summary
      districtSheet["!freeze"] = { xSplit: 0, ySplit: 1 };

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
        user: { select: { id: true, username: true, fullName: true } },
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
