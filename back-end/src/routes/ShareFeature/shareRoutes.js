import express from "express";
import {
  sharePost,
  unsharePost,
  getPostShares,
  checkUserShared,
  getUserShares,
  updateShare,
} from "../../controllers/ShareFeature/shareController.js";
import { authenticate } from "../../middleware/AuthFeature/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/user/:userId", getUserShares);
router.post("/post/:postId", sharePost);
router.put("/:shareId", updateShare);
router.delete("/:postId", unsharePost);
router.get("/:postId/check", checkUserShared);
router.get("/:postId", getPostShares);

export default router;
