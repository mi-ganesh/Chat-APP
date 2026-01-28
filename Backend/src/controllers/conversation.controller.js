import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import User from "../models/user.js";

export async function createConversation(req, res) {
  try {
    const { senderId, receiverId } = req.body;

    // ✅ Validation
    if (!senderId || !receiverId) {
      return res.status(400).json({
        message: "Sender and receiver required",
      });
    }

    // ✅ Prevent self-conversation
    if (senderId === receiverId) {
      return res.status(400).json({
        message: "Cannot create conversation with yourself",
      });
    }

    // ✅ Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        message: "Invalid user ID format",
      });
    }

    // ✅ Convert to ObjectId
    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

    // ✅ Verify both users exist
    const [senderExists, receiverExists] = await Promise.all([
      User.findById(senderObjectId),
      User.findById(receiverObjectId),
    ]);

    if (!senderExists || !receiverExists) {
      return res.status(404).json({
        message: "One or both users not found",
      });
    }

    // ✅ Sort properly to prevent duplicates
    const members = [senderObjectId, receiverObjectId].sort((a, b) => 
      a.toString().localeCompare(b.toString())
    );

    // ✅ Check existing conversation with proper query
    const existingConversation = await Conversation.findOne({
      members: { $all: members, $size: 2 },
    });

    if (existingConversation) {
      return res.status(200).json({
        conversation: existingConversation,
        isNew: false,
      });
    }

    // ✅ Create new conversation
    const newConversation = await Conversation.create({ members });

    res.status(201).json({
      conversation: newConversation,
      isNew: true,
    });

  } catch (error) {
    console.error("createConversation error:", error);
    res.status(500).json({ 
      message: "Failed to create conversation",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export async function getUserid(req, res) {
  try {
    const userId = req.params.userId;

    // ✅ Validate userId
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // ✅ Verify user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Find conversations
    const conversations = await Conversation.find({
      members: { $in: [userId] },
    }).lean();

    console.log("Conversations found:", conversations.length);

    // ✅ If no conversations, return early
    if (conversations.length === 0) {
      return res.status(200).json([]);
    }

    // ✅ Extract other users with better error handling
    const conversationUserData = await Promise.all(
      conversations.map(async (conversation) => {
        try {
          // Find the other member
          const receiverId = conversation.members.find(
            (member) => member.toString() !== userId
          );

          if (!receiverId) {
            console.warn(`No receiver found for conversation ${conversation._id}`);
            return null;
          }

          // Fetch user details
          const user = await User.findById(receiverId).select('email fullName').lean();

          if (!user) {
            console.warn(`User ${receiverId} not found`);
            return null;
          }

          return {
            user: {
              _id: receiverId,  // ✅ FIXED: Added user _id
              email: user.email,
              fullName: user.fullName,
            },
            conversationId: conversation._id,  // ✅ FIXED: Changed from 'conversation' to 'conversationId'
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
          };
        } catch (innerError) {
          console.error(`Error processing conversation ${conversation._id}:`, innerError);
          return null;
        }
      })
    );

    // ✅ Filter out null values and send response
    const validConversations = conversationUserData.filter(Boolean);

    res.status(200).json(validConversations);

  } catch (error) {
    console.error("getUserid error:", error);
    res.status(500).json({ 
      message: "Failed to fetch conversations",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}