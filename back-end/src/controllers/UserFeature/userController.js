import { PrismaClient } from "@prisma/client";
import { body, validationResult } from "express-validator";
import { comparePassword } from "../../utils/AuthFeature/auth.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

export const getProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        location: true,
        website: true,
        verified: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const isFollowing = await prisma.follower.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: user.id,
        },
      },
    });

    res.json({
      success: true,
      data: {
        ...user,
        isFollowing: !!isFollowing,
        isOwnProfile: currentUserId === user.id,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch profile",
    });
  }
};

export const updateProfile = [
  body("name")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),
  body("bio")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),
  body("location")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Location cannot exceed 100 characters"),
  body("website").optional().isURL().withMessage("Please provide a valid URL"),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const userId = req.user.id;
      const { name, bio, location, website } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (bio !== undefined) updateData.bio = bio;
      if (location !== undefined) updateData.location = location;
      if (website !== undefined) updateData.website = website;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          bio: true,
          avatar: true,
          coverPhoto: true,
          location: true,
          website: true,
          verified: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to update profile",
      });
    }
  },
];

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const userId = req.user.id;
    const avatarPath = `/uploads/profiles/${req.file.filename}`;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (user.avatar) {
      try {
        const oldAvatarPath = path.join(__dirname, "../..", user.avatar);
        await fs.unlink(oldAvatarPath);
      } catch (error) {}
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarPath },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        location: true,
        website: true,
        verified: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    // Upload avatar failed
    res.status(500).json({
      success: false,
      error: "Failed to upload avatar",
    });
  }
};

export const uploadCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const userId = req.user.id;
    const coverPath = `/uploads/profiles/${req.file.filename}`;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coverPhoto: true },
    });

    if (user.coverPhoto) {
      try {
        const oldCoverPath = path.join(__dirname, "../..", user.coverPhoto);
        await fs.unlink(oldCoverPath);
      } catch (error) {}
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { coverPhoto: coverPath },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        location: true,
        website: true,
        verified: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to upload cover photo",
    });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const currentUserId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const posts = await prisma.post.findMany({
      where: { userId: user.id },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            verified: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
            shares: true,
          },
        },
        reactions: {
          where: { userId: currentUserId },
          select: {
            id: true,
            reactionType: true,
          },
        },
      },
    });

    // Remove reactions array from response (keep it minimal)
    const postsWithCleanData = posts.map((post) => ({
      ...post,
    }));

    const totalPosts = await prisma.post.count({
      where: { userId: user.id },
    });

    res.json({
      success: true,
      data: postsWithCleanData,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / parseInt(limit)),
        totalPosts,
        hasMore: skip + posts.length < totalPosts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch user posts",
    });
  }
};

export const deleteAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (user.avatar) {
      try {
        const avatarPath = path.join(__dirname, "../..", user.avatar);
        await fs.unlink(avatarPath);
      } catch (error) {}
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        location: true,
        website: true,
        verified: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete avatar",
    });
  }
};

export const deleteCover = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coverPhoto: true },
    });

    if (user.coverPhoto) {
      try {
        const coverPath = path.join(__dirname, "../..", user.coverPhoto);
        await fs.unlink(coverPath);
      } catch (error) {}
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { coverPhoto: null },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        location: true,
        website: true,
        verified: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete cover photo",
    });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const searchTerm = q.toLowerCase();

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: searchTerm } },
          { name: { contains: searchTerm, mode: "insensitive" } },
        ],
        isActive: true,
      },
      take: parseInt(limit),
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        verified: true,
        bio: true,
      },
      orderBy: {
        verified: "desc",
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to search users",
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password is required to delete account",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Incorrect password",
      });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete account",
    });
  }
};
