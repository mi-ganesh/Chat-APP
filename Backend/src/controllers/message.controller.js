import Message from "../models/Messages.js";
import mongoose from "mongoose";
import User from "../models/user.js";
import Conversation from "../models/Conversation.js";

export async function userMessage(req, res) {
  try {
    const { conversationId, receiverId, message } = req.body;
    const senderId = req.user._id; 

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    let conversation;

    // 🔹 NEW conversation
    if (conversationId === "new") {
      if (!receiverId) {
        return res.status(400).json({ message: "receiverId is required" });
      }

      if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        return res.status(400).json({ message: "Invalid receiverId" });
      }

      const receiverExists = await User.findById(receiverId);
      if (!receiverExists) {
        return res.status(404).json({ message: "Receiver not found" });
      }

      const members = [
        new mongoose.Types.ObjectId(senderId),
        new mongoose.Types.ObjectId(receiverId),
      ].sort((a, b) => a.toString().localeCompare(b.toString()));

      conversation = await Conversation.findOne({ 
        members: { $all: members, $size: 2 } 
      });

      if (!conversation) {
        conversation = await Conversation.create({ members });
      }
    }
    // 🔹 EXISTING conversation
    else {
      if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({ message: "Invalid conversationId" });
      }

      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const isMember = conversation.members.some(
        (member) => member.toString() === senderId.toString()
      );
      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this conversation" });
      }
    }

    // 🔹 CREATE MESSAGE
    const newMessage = await Message.create({
      conversationId: conversation._id,
      senderId: senderId,
      message: message,
    });

    // ✅ Update conversation's updatedAt (FIXED - use timestamps instead)
    conversation.updatedAt = new Date();
    await conversation.save();

    // ✅ Populate sender details before returning
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'email fullName')
      .lean();

    res.status(201).json(populatedMessage);

  } catch (error) {
    console.error("userMessage error:", error);
    res.status(500).json({ 
      message: "Failed to send message",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export async function conversationMessage(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversationId" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isMember = conversation.members.some(
      (member) => member.toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this conversation" });
    }

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'email fullName')
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json(messages);

  } catch (error) {
    console.error("conversationMessage error:", error);
    res.status(500).json({ 
      message: "Failed to fetch messages",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export async function users(req, res) {
  try {
    const currentUserId = req.user._id;

    const users = await User.find({ 
      _id: { $ne: currentUserId } 
    })
    .select("email fullName")
    .lean();

    const userData = users.map((user) => ({
      user: {
        email: user.email,
        fullName: user.fullName,
        _id: user._id,
      },
      userId: user._id,
    }));

    res.status(200).json(userData);

  } catch (error) {
    console.error("users error:", error);
    res.status(500).json({
      message: "Failed to fetch users",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}