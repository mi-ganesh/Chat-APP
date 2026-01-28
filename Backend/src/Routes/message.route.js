import express from "express";
import { conversationMessage, userMessage, users } from "../controllers/message.controller.js"; // ✅ Fixed import path
import { protectRoute } from "../middleware/protectRoute.js"; // ✅ Added middleware

const router = express.Router();

// ✅ All routes need authentication
router.post("/", protectRoute, userMessage);
router.get("/users", protectRoute, users); // ✅ IMPORTANT: Put this BEFORE /:conversationId
router.get("/:conversationId", protectRoute, conversationMessage);

export default router;