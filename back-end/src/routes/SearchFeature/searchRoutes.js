import express from "express";
import { authenticate } from "../../middleware/AuthFeature/auth.js";
import {
  searchUsers,
  searchPosts,
  searchAll,
} from "../../controllers/SearchFeature/searchController.js";

const router = express.Router();

router.use(authenticate);

router.get("/users", searchUsers);
router.get("/posts", searchPosts);
router.get("/all", searchAll);

export default router;
