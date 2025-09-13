const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Login endpoint
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
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

      const { username, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get current user info
router.get(
  "/me",
  require("../middleware/auth").authenticateToken,
  async (req, res) => {
    try {
      res.json({
        user: {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role,
        },
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Logout endpoint (client-side token removal)
router.post("/logout", (req, res) => {
  res.json({ message: "Logout successful" });
});

// Create demo users (for development)
router.post("/setup-demo", async (req, res) => {
  try {
    // Check if users already exist
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return res.status(400).json({ message: "Demo users already exist" });
    }

    // Create demo admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.create({
      data: {
        username: "admin",
        passwordHash: adminPassword,
        role: "ADMIN",
      },
    });

    // Create demo dealer user
    const dealerPassword = await bcrypt.hash("dealer123", 10);
    const dealer = await prisma.user.create({
      data: {
        username: "dealer",
        passwordHash: dealerPassword,
        role: "DEALER",
      },
    });

    res.json({
      message: "Demo users created successfully",
      users: [
        { username: "admin", password: "admin123", role: "ADMIN" },
        { username: "dealer", password: "dealer123", role: "DEALER" },
      ],
    });
  } catch (error) {
    console.error("Setup demo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
