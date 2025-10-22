import express from "express";
import {
  createComment,
  getPostComments,
  updateComment,
  deleteComment,
} from "../../controllers/CommentFeature/commentController.js";
import { authenticate } from "../../middleware/AuthFeature/auth.js";

const router = express.Router();

router.use(authenticate);

router.post("/posts/:postId", createComment);
router.get("/posts/:postId", getPostComments);
router.put("/:commentId", updateComment);
router.delete("/:commentId", deleteComment);

export default router;
