import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  addShareReaction,
  removeShareReaction,
  getShareReactions
} from '../controllers/shareReactionController.js';

const router = express.Router();

// Add or update reaction on a share
router.post('/:shareId/reactions', authenticate, addShareReaction);

// Remove reaction from a share
router.delete('/:shareId/reactions', authenticate, removeShareReaction);

// Get all reactions for a share
router.get('/:shareId/reactions', authenticate, getShareReactions);

export default router;
