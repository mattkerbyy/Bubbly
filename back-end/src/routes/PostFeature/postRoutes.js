import express from "express";
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getUserPosts,
} from "../../controllers/PostFeature/postController.js";
import { authenticate } from "../../middleware/AuthFeature/auth.js";
import { uploadPostImage } from "../../config/FileSupportFeature/multer.js";

const router = express.Router();

router.use(authenticate);

router
  .route("/")
  .get(getAllPosts)
  .post(uploadPostImage.array("files", 10), createPost);

router.get("/user/:userId", getUserPosts);

router
  .route("/:id")
  .get(getPostById)
  .put(uploadPostImage.array("files", 10), updatePost)
  .delete(deletePost);

export default router;
