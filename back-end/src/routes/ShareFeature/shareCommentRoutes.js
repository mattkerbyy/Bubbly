import express from "express";
import { authenticate } from "../../middleware/AuthFeature/auth.js";
import {
  createShareComment,
  getShareComments,
  deleteShareComment,
  updateShareComment,
} from "../../controllers/ShareFeature/shareCommentController.js";

const router = express.Router();

router.post("/:shareId/comments", authenticate, createShareComment);
router.get("/:shareId/comments", getShareComments);
router.put("/comments/:commentId", authenticate, updateShareComment);
router.delete("/comments/:commentId", authenticate, deleteShareComment);

export default router;
