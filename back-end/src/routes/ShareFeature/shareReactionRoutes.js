import express from "express";
import { authenticate } from "../../middleware/AuthFeature/auth.js";
import {
  addShareReaction,
  removeShareReaction,
  getShareReactions,
} from "../../controllers/ShareFeature/shareReactionController.js";

const router = express.Router();

router.post("/:shareId/reactions", authenticate, addShareReaction);
router.delete("/:shareId/reactions", authenticate, removeShareReaction);
router.get("/:shareId/reactions", authenticate, getShareReactions);

export default router;
