import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const REACTION_TYPES = ["Like", "Heart", "Laughing", "Wow", "Sad", "Angry"];
export const addShareReaction = async (req, res) => {
  try {
    const { shareId } = req.params;
    const { reactionType } = req.body;
    const userId = req.user.id;
    if (!REACTION_TYPES.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid reaction type. Must be one of: ${REACTION_TYPES.join(
          ", "
        )}`,
      });
    }
    const share = await prisma.share.findUnique({
      where: { id: shareId },
      include: { user: true },
    });

    if (!share) {
      return res.status(404).json({ error: "Share not found" });
    }
    const existingReaction = await prisma.shareReaction.findUnique({
      where: {
        shareId_userId: {
          shareId,
          userId,
        },
      },
    });

    let reaction;
    let isNewReaction = false;

    if (existingReaction) {
      reaction = await prisma.shareReaction.update({
        where: { id: existingReaction.id },
        data: { reactionType }, // Store as PascalCase, not uppercase
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
      });
      if (share.userId !== userId) {
        const existingNotification = await prisma.notification.findFirst({
          where: {
            type: "reaction",
            senderId: userId,
            recipientId: share.userId,
            shareId: shareId,
          },
        });

        if (existingNotification) {
          await prisma.notification.update({
            where: { id: existingNotification.id },
            data: {
              content: `reacted ${reactionType} to your post`,
              reactionType: reactionType,
              createdAt: new Date(), // Update timestamp so it appears as new
            },
          });
        }
      }
    } else {
      isNewReaction = true;
      reaction = await prisma.shareReaction.create({
        data: {
          shareId,
          userId,
          reactionType, // Store as PascalCase, not uppercase
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
      });
      if (share.userId !== userId) {
        await prisma.notification.create({
          data: {
            type: "reaction",
            content: `reacted ${reactionType} to your post`,
            reactionType: reactionType, // Include the reaction type for proper icon display
            senderId: userId,
            recipientId: share.userId,
            shareId: shareId,
          },
        });
      }
    }

    res.status(201).json(reaction);
  } catch (error) {
    console.error("Error adding share reaction:", error);
    res.status(500).json({ error: "Failed to add reaction" });
  }
};
export const removeShareReaction = async (req, res) => {
  try {
    const { shareId } = req.params;
    const userId = req.user.id;

    const reaction = await prisma.shareReaction.findUnique({
      where: {
        shareId_userId: {
          shareId,
          userId,
        },
      },
    });

    if (!reaction) {
      return res.status(404).json({ error: "Reaction not found" });
    }

    await prisma.shareReaction.delete({
      where: { id: reaction.id },
    });

    res.status(200).json({ message: "Reaction removed successfully" });
  } catch (error) {
    console.error("Error removing share reaction:", error);
    res.status(500).json({ error: "Failed to remove reaction" });
  }
};
export const getShareReactions = async (req, res) => {
  try {
    const { shareId } = req.params;
    const currentUserId = req.user?.id; // Get current user ID if authenticated

    const reactions = await prisma.shareReaction.findMany({
      where: { shareId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            verified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const reactionsWithFollowStatus = await Promise.all(
      reactions.map(async (reaction) => {
        const isFollowing =
          currentUserId && currentUserId !== reaction.user.id
            ? await prisma.follower.findUnique({
                where: {
                  followerId_followingId: {
                    followerId: currentUserId,
                    followingId: reaction.user.id,
                  },
                },
              })
            : null;

        return {
          ...reaction,
          user: {
            ...reaction.user,
            isFollowing: !!isFollowing,
          },
        };
      })
    );
    const groupedReactions = reactionsWithFollowStatus.reduce(
      (acc, reaction) => {
        const type = reaction.reactionType;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(reaction);
        return acc;
      },
      {}
    );

    res.status(200).json({
      reactions: reactionsWithFollowStatus,
      groupedReactions,
      totalCount: reactionsWithFollowStatus.length,
    });
  } catch (error) {
    console.error("Error fetching share reactions:", error);
    res.status(500).json({ error: "Failed to fetch reactions" });
  }
};

