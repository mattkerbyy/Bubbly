import express from "express";
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
} from "../../controllers/AuthFeature/authController.js";
import { authenticate } from "../../middleware/AuthFeature/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticate, getMe);

export default router;
