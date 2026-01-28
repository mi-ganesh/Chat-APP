import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./lib/db.js";
import authRoutes from "./Routes/auth.route.js";
import conversationRoutes from "./Routes/conversation.route.js";
import messageRoutes from "./Routes/message.route.js";
import path from "path";

dotenv.config();

const __dirname = path.resolve();

const app = express();

/* ---------- MIDDLEWARE ---------- */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/* ---------- ROUTES ---------- */
app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

/* ---------- HEALTH CHECK ---------- */
app.get("/", (req, res) => {
  res.json({ message: "Chat API is running" });
});

/* ---------- 404 HANDLER ---------- */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* ---------- HTTP SERVER ---------- */
const server = http.createServer(app);

/* ---------- SOCKET.IO ---------- */
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// ✅ Store online users
const onlineUsers = new Map(); // userId -> socketId

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // ✅ User joins with their userId
  socket.on("userOnline", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} is online`);
    
    // Broadcast online users
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  // ✅ Send message to specific user
  socket.on("sendMessage", (data) => {
    const { receiverId, message } = data;
    
    // Send to receiver if online
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", message);
    }
    
    // Also send back to sender for confirmation
    socket.emit("messageSent", message);
  });

  // ✅ User typing indicator
  socket.on("typing", (data) => {
    const { receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", data);
    }
  });

  // ✅ Handle disconnect
  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
    
    // Remove user from online users
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`👤 User ${userId} went offline`);
        
        // Broadcast updated online users
        io.emit("onlineUsers", Array.from(onlineUsers.keys()));
        break;
      }
    }
  });
});

/* ---------- ERROR HANDLER ---------- */
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ 
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

if(process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname,"../Frontend/dist")));
   
  app.get("*",(req,res)=>{
    res.sendFile(path.join(__dirname,"../Frontend","dist","index.html"));
  })
}

/* ---------- START SERVER ---------- */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  connectDB();
});

// ✅ Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});