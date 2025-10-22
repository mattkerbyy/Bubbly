import express from "express";
import {
  addOrUpdateReaction,
  removeReaction,
  getPostReactions,
  checkUserReaction,
  getUserReactedPosts,
} from "../../controllers/ReactionFeature/reactionController.js";
import { authenticate } from "../../middleware/AuthFeature/auth.js";

const router = express.Router();

router.use(authenticate);

router.post("/:postId", addOrUpdateReaction);
router.delete("/:postId", removeReaction);
router.get("/:postId", getPostReactions);
router.get("/:postId/check", checkUserReaction);
router.get("/user/:userId/posts", getUserReactedPosts);

export default router;
