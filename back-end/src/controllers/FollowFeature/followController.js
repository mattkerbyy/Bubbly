import { PrismaClient } from "@prisma/client";
import { createNotification } from "../NotifFeature/notificationController.js";

const prisma = new PrismaClient();

export const followUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;

    if (currentUserId === userId) {
      return res.status(400).json({
        success: false,
        error: "You cannot follow yourself",
      });
    }

    const userToFollow = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const existingFollow = await prisma.follower.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        error: "You are already following this user",
      });
    }

    const follow = await prisma.follower.create({
      data: {
        followerId: currentUserId,
        followingId: userId,
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            verified: true,
          },
        },
      },
    });

    await createNotification({
      type: "follow",
      senderId: currentUserId,
      recipientId: userId,
      content: "started following you",
    });

    res.status(201).json({
      success: true,
      data: follow,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to follow user",
    });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;

    const existingFollow = await prisma.follower.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    });

    if (!existingFollow) {
      return res.status(400).json({
        success: false,
        error: "You are not following this user",
      });
    }

    await prisma.follower.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    });

    res.json({
      success: true,
      message: "Successfully unfollowed user",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to unfollow user",
    });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const followers = await prisma.follower.findMany({
      where: { followingId: userId },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            verified: true,
            bio: true,
            _count: {
              select: {
                followers: true,
              },
            },
          },
        },
      },
    });

    const followerIds = followers.map((f) => f.follower.id);
    const currentUserFollowing = await prisma.follower.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: followerIds },
      },
      select: { followingId: true },
    });

    const followingSet = new Set(
      currentUserFollowing.map((f) => f.followingId)
    );

    const followersWithStatus = followers.map((f) => ({
      ...f.follower,
      isFollowing: followingSet.has(f.follower.id),
      followedAt: f.createdAt,
    }));

    const totalFollowers = await prisma.follower.count({
      where: { followingId: userId },
    });

    res.json({
      success: true,
      data: followersWithStatus,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFollowers / parseInt(limit)),
        total: totalFollowers,
        hasMore: skip + followers.length < totalFollowers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch followers",
    });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const following = await prisma.follower.findMany({
      where: { followerId: userId },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            verified: true,
            bio: true,
            _count: {
              select: {
                followers: true,
              },
            },
          },
        },
      },
    });

    const followingIds = following.map((f) => f.following.id);
    const currentUserFollowing = await prisma.follower.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: followingIds },
      },
      select: { followingId: true },
    });

    const followingSet = new Set(
      currentUserFollowing.map((f) => f.followingId)
    );

    const followingWithStatus = following.map((f) => ({
      ...f.following,
      isFollowing: followingSet.has(f.following.id),
      followedAt: f.createdAt,
    }));

    const totalFollowing = await prisma.follower.count({
      where: { followerId: userId },
    });

    res.json({
      success: true,
      data: followingWithStatus,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFollowing / parseInt(limit)),
        total: totalFollowing,
        hasMore: skip + following.length < totalFollowing,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch following",
    });
  }
};

export const checkFollowStatus = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;

    const follow = await prisma.follower.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    });

    res.json({
      success: true,
      data: {
        isFollowing: !!follow,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to check follow status",
    });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { limit = 5 } = req.query;

    const currentFollowing = await prisma.follower.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followingIds = currentFollowing.map((f) => f.followingId);

    const suggestedUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: [...followingIds, currentUserId],
        },
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
        _count: {
          select: {
            followers: true,
            posts: true,
          },
        },
      },
      orderBy: [{ verified: "desc" }, { followers: { _count: "desc" } }],
    });

    res.json({
      success: true,
      data: suggestedUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch suggested users",
    });
  }
};
