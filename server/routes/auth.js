const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for profile picture uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Ensure uploads directory exists in client public folder
const ensureUploadsDirectory = async () => {
  const uploadsDir = path.join(
    __dirname,
    "../../client/public/uploads/profile-pictures"
  );
  try {
    await fs.access(uploadsDir);
  } catch (error) {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
};

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
          fullName: user.fullName,
          role: user.role,
          district: user.district,
          profilePicture: user.profilePicture,
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
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          district: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
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
          fullName: true,
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
    body("fullName")
      .isLength({ min: 2 })
      .withMessage("Full name must be at least 2 characters"),
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

      const { username, fullName, password, role, district } = req.body;

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
          fullName,
          passwordHash,
          role,
          district: district || null,
        },
        select: {
          id: true,
          username: true,
          fullName: true,
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

// Delete user (territory manager only)
router.delete(
  "/users/:id",
  require("../middleware/auth").authenticateToken,
  require("../middleware/auth").requireRole(["TERRITORY_MANAGER"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent user from deleting their own account
      if (id === req.user.id) {
        return res
          .status(400)
          .json({ message: "Cannot delete your own account" });
      }

      const userToDelete = await prisma.user.findUnique({
        where: { id },
      });

      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }

      // Territory managers can only delete sales promotion assistants
      if (userToDelete.role !== "SALES_PROMOTION_ASSISTANT") {
        return res.status(403).json({
          message:
            "Territory managers can only delete sales promotion assistants",
        });
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

// Update user profile endpoint
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { fullName, district, profilePicture } = req.body;
    const userId = req.user.id;

    if (!fullName || fullName.trim() === "") {
      return res.status(400).json({ message: "Full name is required" });
    }

    const updateData = {
      fullName: fullName.trim(),
    };

    // Add district if provided
    if (district !== undefined) {
      updateData.district = district.trim() || null;
    }

    // For now, we'll just acknowledge the profile picture but not store it
    // In a real app, you'd upload to cloud storage like AWS S3
    if (profilePicture) {
      // Could store profile picture URL in database
      // updateData.profilePictureUrl = uploadedUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        district: true,
        profilePicture: true,
      },
    });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Change password endpoint
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!isValidPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword },
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Upload and resize profile picture endpoint
router.post(
  "/upload-profile-picture",
  authenticateToken,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      await ensureUploadsDirectory();

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { width = 300, height = 300 } = req.body;
      const userId = req.user.id;
      const filename = `${userId}-${Date.now()}.jpg`;
      const filepath = path.join(
        __dirname,
        "../../client/public/uploads/profile-pictures",
        filename
      );

      // Process and resize the image
      await sharp(req.file.buffer)
        .resize(parseInt(width), parseInt(height), {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 90 })
        .toFile(filepath);

      // Update user's profile picture in database
      const profilePictureUrl = `/uploads/profile-pictures/${filename}`;
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profilePicture: profilePictureUrl },
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          district: true,
          profilePicture: true,
        },
      });

      res.json({
        message: "Profile picture uploaded successfully",
        user: updatedUser,
        profilePictureUrl: profilePictureUrl,
      });
    } catch (error) {
      console.error("Upload profile picture error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Remove profile picture endpoint
router.delete(
  "/remove-profile-picture",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;

      // Get current user to find the profile picture file
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { profilePicture: true },
      });

      // If user has a profile picture, try to delete the file
      if (currentUser?.profilePicture) {
        try {
          const filename = path.basename(currentUser.profilePicture);
          const filepath = path.join(
            __dirname,
            "../../client/public/uploads/profile-pictures",
            filename
          );

          // Check if file exists and delete it
          await fs.access(filepath);
          await fs.unlink(filepath);
        } catch (fileError) {
          // File might not exist, that's okay - just log it
          console.log(
            "Profile picture file not found or already deleted:",
            fileError.message
          );
        }
      }

      // Remove profile picture from database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profilePicture: null },
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          district: true,
          profilePicture: true,
        },
      });

      res.json({
        message: "Profile picture removed successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Remove profile picture error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;
