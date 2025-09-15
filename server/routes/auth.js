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

    // Create demo zone manager user
    const zoneManagerPassword = await bcrypt.hash("admin123", 10);
    const zoneManager = await prisma.user.create({
      data: {
        username: "admin",
        passwordHash: zoneManagerPassword,
        role: "ZONE_MANAGER",
      },
    });

    // Create demo field officer user
    const fieldOfficerPassword = await bcrypt.hash("dealer123", 10);
    const fieldOfficer = await prisma.user.create({
      data: {
        username: "dealer",
        passwordHash: fieldOfficerPassword,
        role: "FIELD_OFFICER",
      },
    });

    res.json({
      message: "Demo users created successfully",
      users: [
        { username: "admin", password: "admin123", role: "ZONE_MANAGER" },
        { username: "dealer", password: "dealer123", role: "FIELD_OFFICER" },
      ],
    });
  } catch (error) {
    console.error("Setup demo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all users (zone manager only)
router.get(
  "/users",
  require("../middleware/auth").authenticateToken,
  require("../middleware/auth").requireRole(["ZONE_MANAGER"]),
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ users });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Create new user (zone manager only)
router.post(
  "/users",
  [
    require("../middleware/auth").authenticateToken,
    require("../middleware/auth").requireRole(["ZONE_MANAGER"]),
    body("username")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["ZONE_MANAGER", "FIELD_OFFICER"])
      .withMessage("Role must be ZONE_MANAGER or FIELD_OFFICER"),
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

      const { username, password, role } = req.body;

      // Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          passwordHash,
          role,
        },
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        message: "User created successfully",
        user,
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete user (zone manager only)
router.delete(
  "/users/:id",
  require("../middleware/auth").authenticateToken,
  require("../middleware/auth").requireRole(["ZONE_MANAGER"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent admin from deleting their own account
      if (id === req.user.id) {
        return res
          .status(400)
          .json({ message: "Cannot delete your own account" });
      }

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await prisma.user.delete({
        where: { id },
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;
