const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const messagesRouter = require('./routes/messages');
const fortuneRouter = require('./routes/fortune');
const messageStore = require('./data/messageStore');

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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`👻 User connected: ${socket.id}`);

  // Join a realm
  socket.on('join_realm', ({ realm, username }) => {
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
    const roomName = `realm_${realm}`;
    socket.join(roomName);
    
    // Track user in realm
    if (!realmUsers.has(realm)) {
      realmUsers.set(realm, []);
    }
    const users = realmUsers.get(realm);
    users.push({ socketId: socket.id, username });
    
    console.log(`🌟 ${username} joined realm: ${realm}`);
    
    // Send recent messages to the joining user
    const recentMessages = messageStore.getRecentMessages(realm, 20);
    socket.emit('realm_history', { realm, messages: recentMessages });
    
    // Notify others in the realm
    socket.to(roomName).emit('user_joined', { username, realm });
    
    // Send current users list to the joining user
    socket.emit('realm_users', { realm, users: users.map(u => u.username) });
  });

  // Handle sending messages
  socket.on('send_message', ({ realm, sender, text }) => {
    const message = {
      id: Date.now().toString(),
      sender,
      text,
      realm,
      timestamp: new Date().toISOString()
    };

    // Store message in memory
    messageStore.addMessage(message);

    console.log(`💬 Message in ${realm}: ${sender}: ${text}`);
    
    // Broadcast to all users in the realm (including sender)
    io.to(`realm_${realm}`).emit('receive_message', message);
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
  res.json({
    ...stats,
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
