const express = require("express");
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { SRI_LANKA_DISTRICTS, VALIDATION_RULES } = require("../lib/constants");

const router = express.Router();
const prisma = new PrismaClient();

// Get all submissions (zone manager) or user's submissions
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, isDraft } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = {};

    // If user is sales promotion assistant, only show their submissions
    if (req.user.role === "SALES_PROMOTION_ASSISTANT") {
      whereClause.userId = req.user.id;
    }

    // Filter by draft status if specified
    if (isDraft !== undefined) {
      whereClause.isDraft = isDraft === "true";
    }

    const submissions = await prisma.salesSubmission.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, username: true },
        },
        dailySales: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.salesSubmission.count({ where: whereClause });

    res.json({
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get submissions error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single submission
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await prisma.salesSubmission.findUnique({
      where: { id },
      include: {
        user: {
          select: { username: true },
        },
        dailySales: true,
      },
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Check if user can access this submission
    if (
      req.user.role === "SALES_PROMOTION_ASSISTANT" &&
      submission.userId !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(submission);
  } catch (error) {
    console.error("Get submission error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create or update submission
router.post(
  "/",
  [
    authenticateToken,
    body("district")
      .notEmpty()
      .withMessage("District is required")
      .isIn(SRI_LANKA_DISTRICTS)
      .withMessage("Please select a valid Sri Lankan district"),
    body("city").notEmpty().withMessage("City is required"),
    body("dealerName").notEmpty().withMessage("Dealer name is required"),
    body("dealerNumber")
      .notEmpty()
      .withMessage("Dealer number is required")
      .isNumeric()
      .withMessage("Dealer number must contain only numbers")
      .isLength({
        min: VALIDATION_RULES.DEALER_NUMBER_LENGTH,
        max: VALIDATION_RULES.DEALER_NUMBER_LENGTH,
      })
      .withMessage(
        `Dealer number must be exactly ${VALIDATION_RULES.DEALER_NUMBER_LENGTH} digits`
      ),
    body("assistantName").notEmpty().withMessage("Assistant name is required"),
    body("salesMethod").notEmpty().withMessage("Sales method is required"),
    body("salesLocation").notEmpty().withMessage("Sales location is required"),
    body("dailySales").isArray().withMessage("Daily sales data is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        id, // For updates
        district,
        city,
        dealerName,
        dealerNumber,
        assistantName,
        salesMethod,
        salesLocation,
        dailySales,
        isDraft = true,
      } = req.body;

      // If updating existing submission
      if (id) {
        const existingSubmission = await prisma.salesSubmission.findUnique({
          where: { id },
          include: { dailySales: true },
        });

        if (!existingSubmission) {
          return res.status(404).json({ message: "Submission not found" });
        }

        // Check if user can update this submission
        if (
          req.user.role === "SALES_PROMOTION_ASSISTANT" &&
          existingSubmission.userId !== req.user.id
        ) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Update submission
        const updatedSubmission = await prisma.salesSubmission.update({
          where: { id },
          data: {
            district,
            city,
            dealerName,
            dealerNumber,
            assistantName,
            salesMethod,
            salesLocation,
            isDraft,
          },
        });

        // Delete existing daily sales
        await prisma.dailySales.deleteMany({
          where: { submissionId: id },
        });

        // Create new daily sales
        const dailySalesData = dailySales.map((sale) => ({
          submissionId: id,
          brandName: sale.brandName,
          monday: parseInt(sale.monday) || 0,
          tuesday: parseInt(sale.tuesday) || 0,
          wednesday: parseInt(sale.wednesday) || 0,
          thursday: parseInt(sale.thursday) || 0,
          friday: parseInt(sale.friday) || 0,
          saturday: parseInt(sale.saturday) || 0,
          sunday: parseInt(sale.sunday) || 0,
        }));

        await prisma.dailySales.createMany({
          data: dailySalesData,
        });

        const result = await prisma.salesSubmission.findUnique({
          where: { id },
          include: {
            user: { select: { username: true } },
            dailySales: true,
          },
        });

        return res.json({
          message: "Submission updated successfully",
          submission: result,
        });
      }

      // Create new submission
      const submission = await prisma.salesSubmission.create({
        data: {
          userId: req.user.id,
          district,
          city,
          dealerName,
          dealerNumber,
          assistantName,
          salesMethod,
          salesLocation,
          isDraft,
        },
      });

      // Create daily sales records
      const dailySalesData = dailySales.map((sale) => ({
        submissionId: submission.id,
        brandName: sale.brandName,
        monday: parseInt(sale.monday) || 0,
        tuesday: parseInt(sale.tuesday) || 0,
        wednesday: parseInt(sale.wednesday) || 0,
        thursday: parseInt(sale.thursday) || 0,
        friday: parseInt(sale.friday) || 0,
        saturday: parseInt(sale.saturday) || 0,
        sunday: parseInt(sale.sunday) || 0,
      }));

      await prisma.dailySales.createMany({
        data: dailySalesData,
      });

      const result = await prisma.salesSubmission.findUnique({
        where: { id: submission.id },
        include: {
          user: { select: { username: true } },
          dailySales: true,
        },
      });

      res.status(201).json({
        message: "Submission created successfully",
        submission: result,
      });
    } catch (error) {
      console.error("Create/update submission error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete submission
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await prisma.salesSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Check if user can delete this submission
    // Territory Managers can delete any submission
    // Sales Promotion Assistants can only delete their own submissions
    if (
      req.user.role === "SALES_PROMOTION_ASSISTANT" &&
      submission.userId !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    await prisma.salesSubmission.delete({
      where: { id },
    });

    res.json({ message: "Submission deleted successfully" });
  } catch (error) {
    console.error("Delete submission error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
