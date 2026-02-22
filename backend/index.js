const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const messagesRouter = require('./routes/messages');
const fortuneRouter = require('./routes/fortune');
const messageStore = require('./data/messageStore');
const { validateUsername, validateMessage, validateRealm } = require('./utils/inputValidation');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// In-memory storage for active users per realm
const realmUsers = new Map();
// Rate limiting storage
const rateLimits = new Map();

/**
 * Check rate limit for a user action
 * @param {string} key - Rate limit key (socketId + action)
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} True if within rate limit
 */
function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  
  if (!rateLimits.has(key)) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const limit = rateLimits.get(key);
  
  // Reset if window has passed
  if (now > limit.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  // Check if within limit
  if (limit.count >= maxRequests) {
    return false;
  }
  
  // Increment count
  limit.count++;
  return true;
}

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, limit] of rateLimits.entries()) {
    if (now > limit.resetTime) {
      rateLimits.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`👻 User connected: ${socket.id}`);

  // Join a realm
  socket.on('join_realm', ({ realm, username }) => {
    // Validate inputs
    const realmValidation = validateRealm(realm);
    if (!realmValidation.valid) {
      socket.emit('error', { message: realmValidation.error });
      return;
    }
    
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      socket.emit('error', { message: usernameValidation.error });
      return;
    }
    
    const validatedRealm = realmValidation.sanitized;
    const validatedUsername = usernameValidation.sanitized;

    // Leave previous realm if any
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room !== socket.id && room.startsWith('realm_')) {
        socket.leave(room);
        // Remove from realm users
        const oldRealm = room.replace('realm_', '');
        if (realmUsers.has(oldRealm)) {
          const users = realmUsers.get(oldRealm);
          realmUsers.set(oldRealm, users.filter(u => u.socketId !== socket.id));
        }
      }
    });

    // Join new realm
    const roomName = `realm_${validatedRealm}`;
    socket.join(roomName);
    
    // Track user in realm
    if (!realmUsers.has(validatedRealm)) {
      realmUsers.set(validatedRealm, []);
    }
    const users = realmUsers.get(validatedRealm);
    users.push({ socketId: socket.id, username: validatedUsername });
    
    console.log(`🌟 ${validatedUsername} joined realm: ${validatedRealm}`);
    
    // Send recent messages to the joining user
    const recentMessages = messageStore.getRecentMessages(validatedRealm, 20);
    socket.emit('realm_history', { realm: validatedRealm, messages: recentMessages });
    
    // Notify others in the realm
    socket.to(roomName).emit('user_joined', { username: validatedUsername, realm: validatedRealm });
    
    // Send current users list to the joining user
    socket.emit('realm_users', { realm: validatedRealm, users: users.map(u => u.username) });
  });

  // Handle sending messages
  socket.on('send_message', ({ realm, sender, text }) => {
    // Rate limiting: Max 5 messages per 3 seconds
    const messageRateKey = `msg_${socket.id}`;
    if (!checkRateLimit(messageRateKey, 5, 3000)) {
      socket.emit('error', { 
        message: 'Too many messages. Please wait before sending another message.' 
      });
      return;
    }
    
    // Validate inputs
    const realmValidation = validateRealm(realm);
    if (!realmValidation.valid) {
      socket.emit('error', { message: realmValidation.error });
      return;
    }
    
    const senderValidation = validateUsername(sender);
    if (!senderValidation.valid) {
      socket.emit('error', { message: senderValidation.error });
      return;
    }
    
    const messageValidation = validateMessage(text);
    if (!messageValidation.valid) {
      socket.emit('error', { message: messageValidation.error });
      return;
    }
    
    const validatedRealm = realmValidation.sanitized;
    const validatedSender = senderValidation.sanitized;
    const validatedText = messageValidation.sanitized;

    const message = {
      id: Date.now().toString(),
      sender: validatedSender,
      text: validatedText,
      realm: validatedRealm,
      timestamp: new Date().toISOString()
    };

    // Store message in memory
    messageStore.addMessage(message);

    console.log(`💬 Message in ${validatedRealm}: ${validatedSender}: ${validatedText}`);
    
    // Broadcast to all users in the realm (including sender)
    io.to(`realm_${validatedRealm}`).emit('receive_message', message);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`👋 User disconnected: ${socket.id}`);
    
    // Remove from all realms
    realmUsers.forEach((users, realm) => {
      const userIndex = users.findIndex(u => u.socketId === socket.id);
      if (userIndex !== -1) {
        const user = users[userIndex];
        users.splice(userIndex, 1);
        
        // Notify others in the realm
        socket.to(`realm_${realm}`).emit('user_left', { 
          username: user.username, 
          realm 
        });
      }
    });
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/messages', messagesRouter);
app.use('/api/fortune', fortuneRouter);
app.use('/api/omens', require('./routes/omens'));
app.use('/api/prophecies', require('./routes/prophecies'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'alive',
    service: 'Shinigami-bin API',
    timestamp: new Date().toISOString()
  });
});

// Message store statistics (for debugging)
app.get('/api/messages/stats', (req, res) => {
  const stats = messageStore.getStats();
  const memoryUsage = messageStore.getMemoryUsage();
  res.json({
    ...stats,
    memoryUsage,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

server.listen(PORT, () => {
  console.log(`🔮 Shinigami-bin server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`⚡ Socket.IO server ready for real-time messaging`);
});

module.exports = { app, server, io };
