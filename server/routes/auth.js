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
          district: user.district,
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
      // Get fresh user data from database including district
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, username: true, role: true, district: true },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          district: user.district,
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

// Get all users (zone manager only)
router.get(
  "/users",
  require("../middleware/auth").authenticateToken,
  require("../middleware/auth").requireRole(["TERRITORY_MANAGER"]),
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true,
          district: true,
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
    require("../middleware/auth").requireRole(["TERRITORY_MANAGER"]),
    body("username")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["TERRITORY_MANAGER", "SALES_PROMOTION_ASSISTANT"])
      .withMessage(
        "Role must be TERRITORY_MANAGER or SALES_PROMOTION_ASSISTANT"
      ),
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

      const { username, password, role, district } = req.body;

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
          district: district || null,
        },
        select: {
          id: true,
          username: true,
          role: true,
          district: true,
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
