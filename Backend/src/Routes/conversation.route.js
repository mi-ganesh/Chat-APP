import express from 'express';
import { createConversation, getUserid } from '../controllers/conversation.controller.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

// ✅ Protected routes - user must be authenticated
router.post("/", protectRoute, createConversation);
router.get("/:userId", protectRoute, getUserid);

export default router;