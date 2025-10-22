import express from "express";
import {
  toggleLike,
  getPostLikes,
  checkUserLiked,
  getUserLikedPosts,
} from "../controllers/likeController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All like routes require authentication
router.use(authenticate);

// Toggle like on a post (like/unlike)
router.post("/posts/:postId", toggleLike);

// Get likes for a post with user details (paginated)
router.get("/posts/:postId", getPostLikes);

// Check if current user liked a post
router.get("/posts/:postId/check", checkUserLiked);

// Get posts liked by a user
router.get("/user/:userId/liked", getUserLikedPosts);

export default router;
