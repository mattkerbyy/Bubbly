import { io } from "socket.io-client";

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SOCKET_URL = rawApiUrl.replace(/\/api\/?$/, "");

let socket = null;
let connectionPromise = null;

export const initializeSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    transports: ["websocket", "polling"],
  });

  connectionPromise = new Promise((resolve) => {
    if (socket.connected) {
      resolve();
    } else {
      socket.once("connect", () => {
        resolve();
      });
    }
  });

  socket.on("connect", () => {});

  socket.on("disconnect", (reason) => {});

  socket.on("connect_error", (error) => {});

  socket.on("reconnect_attempt", (attemptNumber) => {});

  socket.on("reconnect", (attemptNumber) => {});

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectionPromise = null;
  }
};

export const getSocket = () => {
  return socket;
};

const waitForConnection = async () => {
  if (!socket) {
    return false;
  }

  if (socket.connected) {
    return true;
  }

  try {
    await connectionPromise;
    return true;
  } catch (error) {
    return false;
  }
};

export const emitTypingStart = async (conversationId, otherUserId) => {
  const isConnected = await waitForConnection();
  if (isConnected && socket) {
    socket.emit("typing-start", { conversationId, otherUserId });
  }
};

export const emitTypingStop = async (conversationId, otherUserId) => {
  const isConnected = await waitForConnection();
  if (isConnected && socket) {
    socket.emit("typing-stop", { conversationId, otherUserId });
  }
};

export const emitSendMessage = async (message, recipientId) => {
  const isConnected = await waitForConnection();
  if (isConnected && socket) {
    socket.emit("send-message", { message, recipientId });
  }
};

export const emitMarkRead = async (conversationId, otherUserId) => {
  const isConnected = await waitForConnection();
  if (isConnected && socket) {
    socket.emit("mark-read", { conversationId, otherUserId });
  }
};

export const onNewMessage = (callback) => {
  if (socket) {
    socket.on("new-message", callback);
  }
};

export const onUserTyping = (callback) => {
  if (socket) {
    socket.on("user-typing", callback);
  }
};

export const onUserStoppedTyping = (callback) => {
  if (socket) {
    socket.on("user-stopped-typing", callback);
  }
};

export const onMessagesRead = (callback) => {
  if (socket) {
    socket.on("messages-read", callback);
  }
};

export const onUserStatus = (callback) => {
  if (socket) {
    socket.on("user-status", callback);
  }
};

export const offNewMessage = (callback) => {
  if (socket && callback) {
    socket.off("new-message", callback);
  }
};

export const offUserTyping = (callback) => {
  if (socket && callback) {
    socket.off("user-typing", callback);
  }
};

export const offUserStoppedTyping = (callback) => {
  if (socket && callback) {
    socket.off("user-stopped-typing", callback);
  }
};

export const offMessagesRead = (callback) => {
  if (socket && callback) {
    socket.off("messages-read", callback);
  }
};

export const offUserStatus = (callback) => {
  if (socket && callback) {
    socket.off("user-status", callback);
  }
};
