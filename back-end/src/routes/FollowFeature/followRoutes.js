import express from "express";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
  getSuggestedUsers,
} from "../../controllers/FollowFeature/followController.js";
import { authenticate } from "../../middleware/AuthFeature/auth.js";

const router = express.Router();

router.use(authenticate);

router.post("/:userId", followUser);
router.delete("/:userId", unfollowUser);
router.get("/:userId/followers", getFollowers);
router.get("/:userId/following", getFollowing);
router.get("/:userId/status", checkFollowStatus);
router.get("/suggestions/users", getSuggestedUsers);

export default router;
