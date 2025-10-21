import { io } from 'socket.io-client'

// Remove /api from SOCKET_URL since Socket.io connects to root
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const SOCKET_URL = rawApiUrl.replace(/\/api\/?$/, '')

let socket = null
let connectionPromise = null

export const initializeSocket = (token) => {
  if (socket) {
    socket.disconnect()
  }

  socket = io(SOCKET_URL, {
    auth: {
      token
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling']
  })

  // Create a promise that resolves when socket connects
  connectionPromise = new Promise((resolve) => {
    if (socket.connected) {
      resolve()
    } else {
      socket.once('connect', () => {
        resolve()
      })
    }
  })

  socket.on('connect', () => {
    // Socket connected
  })

  socket.on('disconnect', (reason) => {
    // Socket disconnected
  })

  socket.on('connect_error', (error) => {
    // Socket connection error occurred
  })

  socket.on('reconnect_attempt', (attemptNumber) => {
    // Reconnection attempt
  })

  socket.on('reconnect', (attemptNumber) => {
    // Socket reconnected
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    connectionPromise = null
  }
}

export const getSocket = () => {
  return socket
}

// Helper to wait for connection
const waitForConnection = async () => {
  if (!socket) {
    // Socket not initialized
    return false
  }
  
  if (socket.connected) {
    return true
  }

  try {
    await connectionPromise
    return true
  } catch (error) {
    // Failed to resolve connection promise
    return false
  }
}

// Emit events with connection check
export const emitTypingStart = async (conversationId, otherUserId) => {
  const isConnected = await waitForConnection()
  if (isConnected && socket) {
    socket.emit('typing-start', { conversationId, otherUserId })
  }
}

export const emitTypingStop = async (conversationId, otherUserId) => {
  const isConnected = await waitForConnection()
  if (isConnected && socket) {
    socket.emit('typing-stop', { conversationId, otherUserId })
  }
}

export const emitSendMessage = async (message, recipientId) => {
  const isConnected = await waitForConnection()
  if (isConnected && socket) {
    socket.emit('send-message', { message, recipientId })
  }
}

export const emitMarkRead = async (conversationId, otherUserId) => {
  const isConnected = await waitForConnection()
  if (isConnected && socket) {
    socket.emit('mark-read', { conversationId, otherUserId })
  }
}

// Listen to events
export const onNewMessage = (callback) => {
  if (socket) {
    socket.on('new-message', callback)
  }
}

export const onUserTyping = (callback) => {
  if (socket) {
    socket.on('user-typing', callback)
  }
}

export const onUserStoppedTyping = (callback) => {
  if (socket) {
    socket.on('user-stopped-typing', callback)
  }
}

export const onMessagesRead = (callback) => {
  if (socket) {
    socket.on('messages-read', callback)
  }
}

export const onUserStatus = (callback) => {
  if (socket) {
    socket.on('user-status', callback)
  }
}

// Remove event listeners - now accepts callback to remove specific listener
export const offNewMessage = (callback) => {
  if (socket && callback) {
    socket.off('new-message', callback)
  }
}

export const offUserTyping = (callback) => {
  if (socket && callback) {
    socket.off('user-typing', callback)
  }
}

export const offUserStoppedTyping = (callback) => {
  if (socket && callback) {
    socket.off('user-stopped-typing', callback)
  }
}

export const offMessagesRead = (callback) => {
  if (socket && callback) {
    socket.off('messages-read', callback)
  }
}

export const offUserStatus = (callback) => {
  if (socket && callback) {
    socket.off('user-status', callback)
  }
}
