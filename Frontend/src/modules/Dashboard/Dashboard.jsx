import panda from "../../assets/panda.png";
import Input from "../../components";
import send from "../../assets/send.svg";
import { useState, useEffect, useRef } from "react";
import { useSocket } from "../../context/SocketContext";

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [showNewChat, setShowNewChat] = useState(false);
    const messagesEndRef = useRef(null);
    const { socket, onlineUsers } = useSocket();

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch authenticated user
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/auth/me", {
                    credentials: "include",
                });

                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                } else {
                    window.location.href = "/users/sign-in";
                }
            } catch (error) {
                console.error("Failed to fetch user:", error);
            }
        };

        fetchUser();
    }, []);

    // ✅ Emit userOnline when user is authenticated
    useEffect(() => {
        if (socket && user?._id) {
            socket.emit("userOnline", user._id);
            console.log("✅ User online emitted:", user._id);
        }
    }, [socket, user]);

    // Fetch conversations
    useEffect(() => {
        if (!user?._id) return;

        const fetchConversations = async () => {
            try {
                const res = await fetch(
                    `http://localhost:3000/api/conversations/${user._id}`,
                    { credentials: "include" }
                );

                if (res.ok) {
                    const data = await res.json();
                    console.log("Conversations:", data);
                    setConversations(data);
                }
            } catch (error) {
                console.error("Failed to fetch conversations:", error);
            }
        };

        fetchConversations();
    }, [user]);

    // Fetch all users for new conversations
    useEffect(() => {
        if (!user?._id) return;

        const fetchAllUsers = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/messages/users", {
                    credentials: "include",
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log("All users:", data);
                    setAllUsers(data);
                }
            } catch (error) {
                console.error("Failed to fetch users:", error);
            }
        };

        fetchAllUsers();
    }, [user]);

    // ✅ Listen for incoming messages via Socket.IO
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (newMessage) => {
            console.log("📨 Received message via socket:", newMessage);
            
            // ✅ Add message if it's for the current conversation
            if (newMessage.conversationId === selectedConversation) {
                setMessages((prev) => [...prev, newMessage]);
            }

            // ✅ Update conversations list to show latest message
            setConversations((prev) => {
                return prev.map((conv) =>
                    conv.conversationId === newMessage.conversationId
                        ? { ...conv, updatedAt: new Date() }
                        : conv
                );
            });
        };

        socket.on("receiveMessage", handleReceiveMessage);

        return () => {
            socket.off("receiveMessage", handleReceiveMessage);
        };
    }, [socket, selectedConversation]);

    // Fetch messages for a conversation
    const fetchMessages = async (conversationId, userDetails) => {
        try {
            setLoading(true);
            const res = await fetch(
                `http://localhost:3000/api/messages/${conversationId}`,
                { credentials: "include" }
            );

            if (res.ok) {
                const data = await res.json();
                console.log("MESSAGES FROM API 👉", data);
                setMessages(data);
                setSelectedUser(userDetails);
            } else {
                console.error("Failed to fetch messages:", res.status);
                setMessages([]);
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    // Start a new conversation
    const startNewConversation = async (receiverUser) => {
        try {
            // Check if conversation already exists
            const existingConv = conversations.find(
                (conv) => conv.user._id === receiverUser.userId
            );

            if (existingConv) {
                setSelectedConversation(existingConv.conversationId);
                fetchMessages(existingConv.conversationId, existingConv.user);
                setShowNewChat(false);
                return;
            }

            // Create new conversation
            const res = await fetch("http://localhost:3000/api/conversations", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    senderId: user._id,
                    receiverId: receiverUser.userId,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const newConvId = data.conversation._id;

                // Add to conversations list
                const newConv = {
                    conversationId: newConvId,
                    user: receiverUser.user,
                };
                setConversations((prev) => [...prev, newConv]);

                // Select the new conversation
                setSelectedConversation(newConvId);
                setSelectedUser(receiverUser.user);
                setMessages([]);
                setShowNewChat(false);
            }
        } catch (error) {
            console.error("Failed to create conversation:", error);
        }
    };

    // Send message
    const handleSendMessage = async () => {
        if (!text.trim() || !selectedConversation) return;

        const messageText = text.trim();
        setText("");

        try {
            const res = await fetch("http://localhost:3000/api/messages", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    conversationId: selectedConversation,
                    message: messageText,
                }),
            });

            if (res.ok) {
                const newMessage = await res.json();

                // ✅ Add to your own messages immediately
                setMessages((prev) => [...prev, newMessage]);

                // ✅ Emit to other user via socket
                if (socket && selectedUser?._id) {
                    console.log("📤 Sending message via socket to:", selectedUser._id);
                    socket.emit("sendMessage", {
                        receiverId: selectedUser._id,
                        message: newMessage,
                    });
                }
            } else {
                console.error("Failed to send message:", res.status);
                setText(messageText);
            }
        } catch (error) {
            console.error("Send message failed:", error);
            setText(messageText);
        }
    };

    // Logout handler
    const handleLogout = async () => {
        try {
            // ✅ Disconnect socket before logout
            if (socket) {
                socket.disconnect();
            }

            const res = await fetch("http://localhost:3000/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });

            if (res.ok) {
                window.location.href = "/users/sign-in";
            }
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    // ✅ Check if user is online
    const isUserOnline = (userId) => {
        return onlineUsers.includes(userId);
    };

    return (
        <div className="w-screen h-screen flex relative bg-gray-50">
            {/* LOGOUT BUTTON */}
            <button
                onClick={handleLogout}
                className="absolute top-6 right-6 bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition text-sm font-medium shadow-md z-10"
            >
                Logout
            </button>

            {/* LEFT SIDEBAR */}
            <div className="w-[25%] bg-white shadow-sm flex flex-col border-r">
                {/* PROFILE */}
                <div className="flex items-center p-6 border-b">
                    <div className="border-2 border-primary p-[2px] rounded-full relative">
                        <img
                            src={panda}
                            alt="profile"
                            className="w-[60px] h-[60px] rounded-full"
                        />
                        {/* ✅ Your online indicator */}
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>

                    <div className="ml-4">
                        <h3 className="text-xl font-semibold">
                            {user ? user.fullName : "Loading..."}
                        </h3>
                        <p className="text-sm text-gray-500">My Account</p>
                    </div>
                </div>

                {/* TOGGLE BUTTONS */}
                <div className="flex border-b">
                    <button
                        onClick={() => setShowNewChat(false)}
                        className={`flex-1 py-3 text-sm font-semibold transition ${
                            !showNewChat
                                ? "bg-primary text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        Messages ({conversations.length})
                    </button>
                    <button
                        onClick={() => setShowNewChat(true)}
                        className={`flex-1 py-3 text-sm font-semibold transition ${
                            showNewChat
                                ? "bg-primary text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        New Chat
                    </button>
                </div>

                {/* CONTACT LIST */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                        {!showNewChat ? (
                            // EXISTING CONVERSATIONS
                            conversations.length > 0 ? (
                                conversations.map((item) => (
                                    <div
                                        key={item.conversationId}
                                        className={`flex items-center mb-2 cursor-pointer hover:bg-gray-100 p-3 rounded-lg transition ${
                                            selectedConversation === item.conversationId
                                                ? "bg-blue-50 border-l-4 border-primary"
                                                : ""
                                        }`}
                                        onClick={() => {
                                            setSelectedConversation(item.conversationId);
                                            fetchMessages(item.conversationId, item.user);
                                        }}
                                    >
                                        {/* ✅ User avatar with online indicator */}
                                        <div className="relative">
                                            <img
                                                src={panda}
                                                alt={item.user.fullName}
                                                className="w-[45px] h-[45px] rounded-full"
                                            />
                                            {/* ✅ Online status dot */}
                                            {isUserOnline(item.user._id) && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                            )}
                                        </div>

                                        <div className="ml-3 flex-1 min-w-0">
                                            <h5 className="text-md font-medium truncate">
                                                {item.user.fullName}
                                            </h5>
                                            <p className="text-sm text-gray-500 truncate">
                                                {isUserOnline(item.user._id) ? (
                                                    <span className="text-green-600 font-medium">● Online</span>
                                                ) : (
                                                    item.user.email
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-400 mt-20">
                                    <p className="text-lg font-medium">No Conversations</p>
                                    <p className="text-sm mt-2">Start a new chat</p>
                                </div>
                            )
                        ) : (
                            // ALL USERS FOR NEW CHAT
                            allUsers.length > 0 ? (
                                allUsers.map((item) => (
                                    <div
                                        key={item.userId}
                                        className="flex items-center mb-2 cursor-pointer hover:bg-gray-100 p-3 rounded-lg transition"
                                        onClick={() => startNewConversation(item)}
                                    >
                                        {/* ✅ User avatar with online indicator */}
                                        <div className="relative">
                                            <img
                                                src={panda}
                                                alt={item.user.fullName}
                                                className="w-[45px] h-[45px] rounded-full"
                                            />
                                            {/* ✅ Online status dot */}
                                            {isUserOnline(item.userId) && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                            )}
                                        </div>

                                        <div className="ml-3 flex-1 min-w-0">
                                            <h5 className="text-md font-medium truncate">
                                                {item.user.fullName}
                                            </h5>
                                            <p className="text-sm text-gray-500 truncate">
                                                {isUserOnline(item.userId) ? (
                                                    <span className="text-green-600 font-medium">● Online</span>
                                                ) : (
                                                    item.user.email
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-400 mt-20">
                                    <p className="text-lg font-medium">No Users Found</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* CHAT AREA */}
            <div className="w-[50%] h-full bg-white flex flex-col">
                {/* CHAT HEADER */}
                <div className="w-[90%] bg-secondary h-[80px] mt-8 mb-4 rounded-full flex items-center px-8 mx-auto shrink-0 shadow-sm">
                    {/* ✅ User avatar with online indicator */}
                    <div className="relative">
                        <img
                            src={panda}
                            width={60}
                            height={60}
                            alt="chat-user"
                            className="rounded-full"
                        />
                        {/* ✅ Online status dot */}
                        {selectedUser && isUserOnline(selectedUser._id) && (
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                    </div>
                    
                    <div className="ml-6">
                        <h3 className="text-lg font-semibold">
                            {selectedUser
                                ? selectedUser.fullName
                                : "Select a conversation"}
                        </h3>
                        <p className="text-sm font-light text-gray-500">
                            {selectedUser ? (
                                isUserOnline(selectedUser._id) ? (
                                    <span className="text-green-600 font-medium">● Online</span>
                                ) : (
                                    <span className="text-gray-400">Offline</span>
                                )
                            ) : (
                                ""
                            )}
                        </p>
                    </div>
                </div>

                {/* CHAT MESSAGES */}
                <div className="flex-1 w-full overflow-y-auto px-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <p className="text-gray-400 mt-2">Loading messages...</p>
                            </div>
                        </div>
                    ) : messages.length > 0 ? (
                        <div className="flex flex-col gap-3 py-4">
                            {messages.map((msg) => {
                                const isOwnMessage =
                                    msg.senderId?._id === user?._id ||
                                    msg.senderId === user?._id;

                                return (
                                    <div
                                        key={msg._id}
                                        className={`flex ${
                                            isOwnMessage ? "justify-end" : "justify-start"
                                        }`}
                                    >
                                        <div
                                            className={`max-w-[70%] px-4 py-3 shadow-sm ${
                                                isOwnMessage
                                                    ? "bg-primary text-white rounded-tl-2xl rounded-bl-2xl rounded-br-2xl"
                                                    : "bg-secondary text-black rounded-tr-2xl rounded-br-2xl rounded-bl-2xl"
                                            }`}
                                        >
                                            {!isOwnMessage && msg.senderId?.fullName && (
                                                <p className="text-xs text-gray-600 mb-1 font-semibold">
                                                    {msg.senderId.fullName}
                                                </p>
                                            )}
                                            <p className="break-words">{msg.message}</p>
                                            {msg.createdAt && (
                                                <p
                                                    className={`text-xs mt-1 ${
                                                        isOwnMessage
                                                            ? "text-blue-100"
                                                            : "text-gray-500"
                                                    }`}
                                                >
                                                    {new Date(msg.createdAt).toLocaleTimeString(
                                                        [],
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        }
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-400 text-center">
                                {selectedConversation
                                    ? "No messages yet. Start the conversation!"
                                    : "Select a conversation to start chatting"}
                            </p>
                        </div>
                    )}
                </div>

                {/* MESSAGE INPUT */}
                {selectedConversation && (
                    <div className="p-6 w-full flex items-center shrink-0 border-t bg-white">
                        <Input
                            placeholder="Type a message..."
                            className="flex-1"
                            inputClassName="p-3 px-4 shadow-md rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />

                        <button
                            className="ml-4 cursor-pointer bg-primary hover:bg-blue-600 transition rounded-full p-3 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleSendMessage}
                            disabled={!text.trim()}
                        >
                            <img src={send} alt="send" className="w-6 h-6" />
                        </button>
                    </div>
                )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="w-[25%] h-full shadow-sm bg-white border-l">
                {selectedUser && (
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
                        <div className="flex flex-col items-center">
                            {/* ✅ User avatar with online indicator */}
                            <div className="relative mb-4">
                                <img
                                    src={panda}
                                    alt={selectedUser.fullName}
                                    className="w-24 h-24 rounded-full"
                                />
                                {/* ✅ Online status dot */}
                                {isUserOnline(selectedUser._id) && (
                                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                                )}
                            </div>
                            
                            <h4 className="text-xl font-semibold">
                                {selectedUser.fullName}
                            </h4>
                            <p className="text-sm text-gray-500 mb-2">{selectedUser.email}</p>
                            
                            {/* ✅ Online status badge */}
                            <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                                isUserOnline(selectedUser._id)
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                            }`}>
                                {isUserOnline(selectedUser._id) ? "● Online" : "○ Offline"}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;