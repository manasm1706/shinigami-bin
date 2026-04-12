require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const messagesRouter = require('./routes/messages');
const fortuneRouter = require('./routes/fortune');
const messageStore = require('./data/messageStore');
const { getAllRealmConfigs } = require('./data/realmConfig');
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

// Socket.IO JWT middleware — attaches socket.userId if token valid
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.sub;
      socket.username = payload.username;
    } catch {
      // Invalid token — allow as guest, userId stays undefined
    }
  }
  next();
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`👻 User connected: ${socket.id}`);

  // Join a realm
  socket.on('join_realm', async ({ realm, username }) => {
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
    let recentMessages = messageStore.getRecentMessages(validatedRealm, 20);

    // Try to load from DB if user is authenticated
    if (socket.userId) {
      try {
        const prisma = require('./lib/prisma');
        const conv = await prisma.conversation.findFirst({
          where: { type: 'realm', realmId: validatedRealm }
        });
        if (conv) {
          const dbMessages = await prisma.message.findMany({
            where: { conversationId: conv.id },
            orderBy: { createdAt: 'asc' },
            take: 20,
            include: { sender: { select: { username: true } } }
          });
          if (dbMessages.length > 0) {
            recentMessages = dbMessages.map(m => ({
              id: m.id,
              sender: m.sender.username,
              text: m.content,
              realm: validatedRealm,
              timestamp: m.createdAt.toISOString()
            }));
          }
        }
      } catch (dbErr) {
        console.warn('⚠️ DB history load failed (in-memory fallback):', dbErr.message);
      }
    }

    socket.emit('realm_history', { realm: validatedRealm, messages: recentMessages });
    
    // Notify others in the realm
    socket.to(roomName).emit('user_joined', { username: validatedUsername, realm: validatedRealm });
    
    // Send current users list to the joining user
    socket.emit('realm_users', { realm: validatedRealm, users: users.map(u => u.username) });
  });

  // Handle sending messages
  socket.on('send_message', async ({ realm, sender, text, clientId, type = 'text', asciiGifId }) => {
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
      clientId: clientId || null,
      sender: validatedSender,
      text: validatedText,
      realm: validatedRealm,
      timestamp: new Date().toISOString(),
      type: type === 'ascii_gif' ? 'ascii_gif' : 'text',
    };

    // Attach ascii gif data if present
    if (type === 'ascii_gif' && asciiGifId && socket.userId) {
      try {
        const prisma = require('./lib/prisma');
        const gif = await prisma.asciiGif.findUnique({ where: { id: asciiGifId } });
        if (gif) {
          message.asciiGif = { id: gif.id, frames: JSON.parse(gif.frames), frameDelay: gif.frameDelay, title: gif.title };
        }
      } catch { /* non-fatal */ }
    }

    // Always store in-memory as fallback
    messageStore.addMessage(message);

    // Persist to DB if authenticated user — find or create realm conversation
    if (socket.userId) {
      try {
        const prisma = require('./lib/prisma');
        // Find or create the realm conversation
        let conv = await prisma.conversation.findFirst({
          where: { type: 'realm', realmId: validatedRealm }
        });
        if (!conv) {
          conv = await prisma.conversation.create({
            data: { type: 'realm', realmId: validatedRealm, name: validatedRealm }
          });
        }
        await prisma.message.create({
          data: {
            conversationId: conv.id,
            senderId: socket.userId,
            content: validatedText,
            type: type === 'ascii_gif' ? 'ascii_gif' : 'text',
            asciiGifId: type === 'ascii_gif' ? asciiGifId : undefined,
          }
        });
        // Update message id to DB id for consistency
        message.id = `db_${conv.id}_${Date.now()}`;
      } catch (dbErr) {
        console.warn('⚠️ DB message persist failed (in-memory fallback active):', dbErr.message);
      }
    }

    console.log(`💬 Message in ${validatedRealm}: ${validatedSender}: ${validatedText}`);
    
    // Broadcast to all users in the realm (including sender)
    io.to(`realm_${validatedRealm}`).emit('receive_message', message);

    // Acknowledge delivery to the sender
    if (message.clientId) {
      socket.emit('message_ack', { clientId: message.clientId, id: message.id });
    }
  });

  // Send message to a DM/group conversation room
  socket.on('send_conversation_message', async ({ conversationId, text, clientId, type = 'text', asciiGifId }) => {
    if (!socket.userId || !conversationId || !text) return;

    const messageRateKey = `msg_${socket.id}`;
    if (!checkRateLimit(messageRateKey, 5, 3000)) {
      socket.emit('error', { message: 'Too many messages. Please wait.' });
      return;
    }

    const messageValidation = validateMessage(text);
    if (!messageValidation.valid) {
      socket.emit('error', { message: messageValidation.error });
      return;
    }

    try {
      const prisma = require('./lib/prisma');
      // Verify membership
      const member = await prisma.conversationMember.findUnique({
        where: { userId_conversationId: { userId: socket.userId, conversationId } }
      });
      if (!member) {
        socket.emit('error', { message: 'Not a member of this conversation' });
        return;
      }

      const dbMsg = await prisma.message.create({
        data: {
          conversationId,
          senderId: socket.userId,
          content: messageValidation.sanitized,
          type: type === 'ascii_gif' ? 'ascii_gif' : 'text',
          asciiGifId: type === 'ascii_gif' ? asciiGifId : undefined,
        },
        include: { sender: { select: { id: true, username: true } } }
      });

      const message = {
        id: dbMsg.id,
        clientId: clientId || null,
        sender: dbMsg.sender.username,
        senderId: dbMsg.senderId,
        text: dbMsg.content,
        conversationId,
        timestamp: dbMsg.createdAt.toISOString(),
        type: dbMsg.type,
      };

      // Attach ascii gif data
      if (dbMsg.type === 'ascii_gif' && asciiGifId) {
        try {
          const gif = await prisma.asciiGif.findUnique({ where: { id: asciiGifId } });
          if (gif) message.asciiGif = { id: gif.id, frames: JSON.parse(gif.frames), frameDelay: gif.frameDelay, title: gif.title };
        } catch { /* non-fatal */ }
      }

      io.to(`conversation_${conversationId}`).emit('receive_message', message);
      if (clientId) socket.emit('message_ack', { clientId, id: dbMsg.id });
    } catch (err) {
      console.error('send_conversation_message error:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Reaction toggle via socket (real-time broadcast)
  socket.on('toggle_reaction', async ({ messageId, emoji }) => {
    if (!socket.userId || !messageId || !emoji) return;
    const ALLOWED = ['👍','👎','❤️','😂','😮','😢','🔥','💀','👻','⚡'];
    if (!ALLOWED.includes(emoji)) return;
    try {
      const prisma = require('./lib/prisma');
      const message = await prisma.message.findUnique({ where: { id: messageId } });
      if (!message) return;
      const member = await prisma.conversationMember.findUnique({
        where: { userId_conversationId: { userId: socket.userId, conversationId: message.conversationId } }
      });
      if (!member) return;

      const existing = await prisma.messageReaction.findUnique({
        where: { messageId_userId_emoji: { messageId, userId: socket.userId, emoji } }
      });
      if (existing) {
        await prisma.messageReaction.delete({ where: { id: existing.id } });
      } else {
        await prisma.messageReaction.create({ data: { messageId, userId: socket.userId, emoji } });
      }

      const reactions = await prisma.messageReaction.groupBy({
        by: ['emoji'], where: { messageId }, _count: { emoji: true }
      });
      io.to(`conversation_${message.conversationId}`).emit('reaction_updated', {
        messageId,
        reactions: reactions.map(r => ({ emoji: r.emoji, count: r._count.emoji }))
      });
    } catch (err) {
      console.error('toggle_reaction error:', err);
    }
  });

  // Typing indicators (conversation-scoped)
  socket.on('typing_start', ({ conversationId }) => {
    if (!conversationId || !socket.username) return;
    socket.to(`conversation_${conversationId}`).emit('typing', {
      conversationId,
      username: socket.username
    });
  });

  socket.on('typing_stop', ({ conversationId }) => {
    if (!conversationId || !socket.username) return;
    socket.to(`conversation_${conversationId}`).emit('typing_stopped', {
      conversationId,
      username: socket.username
    });
  });

  // Join a conversation room (DM / group)
  socket.on('join_conversation', ({ conversationId }) => {
    if (!conversationId) return;
    socket.join(`conversation_${conversationId}`);
    console.log(`💬 Socket ${socket.id} joined conversation: ${conversationId}`);
    // Broadcast updated online users to the conversation room
    const room = io.sockets.adapter.rooms.get(`conversation_${conversationId}`);
    const onlineCount = room ? room.size : 1;
    io.to(`conversation_${conversationId}`).emit('online_users', {
      conversationId,
      count: onlineCount
    });
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
app.use('/api/auth', require('./routes/auth'));
app.use('/api/messages', messagesRouter);
app.use('/api/fortune', fortuneRouter);
app.use('/api/omens', require('./routes/omens'));
app.use('/api/prophecies', require('./routes/prophecies'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/ascii-gifs', require('./routes/asciiGifs'));
app.use('/api/messages/:messageId/reactions', require('./routes/reactions'));
app.use('/api/rituals', require('./routes/rituals'));

// Health check
app.get('/api/health', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    const prisma = require('./lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'unavailable';
  }
  res.json({ 
    status: 'alive',
    service: 'Shinigami-bin API',
    db: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Realm configurations
app.get('/api/realms', (req, res) => {
  res.json(getAllRealmConfigs());
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
