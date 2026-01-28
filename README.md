CODETECH TASK1:

💬 Chat-APP | MERN Real-Time Chat Application

A production-ready real-time chat application built using the MERN stack (MongoDB, Express, React, Node.js) with Socket.IO for instant messaging.  
The app supports secure authentication, private conversations, real-time messaging, and online user presence with a modern UI.

✨ Features

🔐 Authentication & Authorization
- User Signup & Signin
- JWT-based authentication
- HTTP-only cookies for security
- Protected routes (frontend & backend)
- Auto-redirect based on auth state

💬 Chat Functionality
- One-to-one private conversations
- Conversation creation on first message
- Persistent chat history
- Messages stored in MongoDB

⚡ Real-Time Features (Socket.IO)
- Instant message delivery
- Online / offline user tracking
- Typing indicator
- Real-time UI updates without page refresh

🎨 UI / UX
- Clean and responsive layout
- Fixed message input at bottom
- Scrollable message area
- Sidebar conversation list
- Tailwind CSS styling

How Run This:

create a .env and inside it
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
NODE_ENV=development

Backend Setup:
cd Backend
npm install
npm run dev

FrontEnd setup:
cd Frontend
npm install
npm run dev




