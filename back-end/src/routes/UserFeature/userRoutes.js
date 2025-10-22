import express from "express";
import { authenticate } from "../../middleware/AuthFeature/auth.js";
import { profileUpload } from "../../config/FileSupportFeature/multer.js";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  uploadCover,
  deleteAvatar,
  deleteCover,
  getUserPosts,
  searchUsers,
  deleteAccount,
} from "../../controllers/UserFeature/userController.js";

const router = express.Router();

router.use(authenticate);

router.get("/search", searchUsers);
router.get("/:username", getProfile);
router.put("/profile", updateProfile);
router.put("/avatar", profileUpload.single("avatar"), uploadAvatar);
router.delete("/avatar", deleteAvatar);
router.put("/cover", profileUpload.single("cover"), uploadCover);
router.delete("/cover", deleteCover);
router.get("/:username/posts", getUserPosts);
router.delete("/account", deleteAccount);

export default router;
