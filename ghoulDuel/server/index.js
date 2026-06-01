require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const {
  MAZE_W, MAZE_H, MAX_PLAYERS, MIN_PLAYERS_PVP,
  GAME_DURATION, TICK_RATE, SOUL_COUNT,
  generateMaze, placeSouls, createBot,
  botThink, tryMove, checkSoulCollection, checkSoulStealing,
  SPAWN_POINTS, shuffle,
} = require('./gameLogic');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3002;

// ── Room registry ─────────────────────────────────────────────────────────────
// rooms: Map<roomId, RoomState>
const rooms = new Map();
// socketToRoom: Map<socketId, roomId>
const socketToRoom = new Map();

let publicRoomId = null; // current public matchmaking room

function generateRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ── Room state factory ────────────────────────────────────────────────────────
function createRoom(isPrivate = false) {
  const id = generateRoomId();
  const room = {
    id,
    isPrivate,
    phase: 'lobby',   // lobby | countdown | playing | results
    players: {},      // socketId -> player
    bots: {},         // botId -> bot
    maze: null,
    souls: [],
    countdown: 5,
    countdownTimer: null,
    gameTimer: null,
    tickInterval: null,
    timeLeft: GAME_DURATION,
    startedAt: null,
    botIdCounter: 0,
  };
  rooms.set(id, room);
  return room;
}

function getOrCreatePublicRoom() {
  if (publicRoomId && rooms.has(publicRoomId)) {
    const room = rooms.get(publicRoomId);
    if (room.phase === 'lobby') return room;
  }
  const room = createRoom(false);
  publicRoomId = room.id;
  return room;
}

// ── Player factory ────────────────────────────────────────────────────────────
function createPlayer(socketId, name, colorIdx, spawnIdx) {
  const spawn = SPAWN_POINTS[spawnIdx % SPAWN_POINTS.length];
  return {
    id: socketId,
    name: name.slice(0, 16),
    x: spawn.x,
    y: spawn.y,
    souls: 0,
    isBot: false,
    alive: true,
    color: colorIdx,
    dir: { x: 0, y: 0 },
  };
}

// ── Fill bots to reach MAX_PLAYERS ───────────────────────────────────────────
function fillBots(room) {
  const humanCount = Object.keys(room.players).length;
  const botCount = MAX_PLAYERS - humanCount;
  room.bots = {};
  for (let i = 0; i < botCount; i++) {
    const botId = `bot_${room.id}_${i}`;
    const spawnIdx = humanCount + i;
    room.bots[botId] = createBot(botId, spawnIdx);
  }
}

// ── Start game ────────────────────────────────────────────────────────────────
function startGame(room) {
  room.phase = 'playing';
  room.maze = generateMaze();
  room.souls = placeSouls(room.maze);
  room.timeLeft = GAME_DURATION;
  room.startedAt = Date.now();

  // Assign spawn points to human players
  const humanIds = Object.keys(room.players);
  humanIds.forEach((sid, i) => {
    const spawn = SPAWN_POINTS[i % SPAWN_POINTS.length];
    room.players[sid].x = spawn.x;
    room.players[sid].y = spawn.y;
    room.players[sid].souls = 0;
  });

  fillBots(room);

  io.to(room.id).emit('game_start', {
    maze: room.maze,
    souls: room.souls,
    players: room.players,
    bots: room.bots,
    timeLeft: room.timeLeft,
  });

  // Game tick
  let tick = 0;
  room.tickInterval = setInterval(() => {
    tick++;
    room.timeLeft = Math.max(0, GAME_DURATION - (Date.now() - room.startedAt));

    // Move bots
    for (const bot of Object.values(room.bots)) {
      bot.botTick++;
      if (bot.botTick % 8 === 0) {
        bot.dir = botThink(bot, { maze: room.maze, souls: room.souls, players: { ...room.players, ...room.bots } });
      }
      tryMove(bot, bot.dir, room.maze);
      const collected = checkSoulCollection(bot, room.souls);
      if (collected.length) {
        io.to(room.id).emit('souls_collected', { playerId: bot.id, soulIds: collected, newTotal: bot.souls });
      }
    }

    // Broadcast state every tick
    const state = {
      players: room.players,
      bots: room.bots,
      souls: room.souls,
      timeLeft: room.timeLeft,
    };
    io.to(room.id).emit('game_tick', state);

    // End condition
    const allCollected = room.souls.every(s => s.collected);
    if (room.timeLeft <= 0 || allCollected) {
      endGame(room);
    }
  }, TICK_RATE);
}

// ── End game ──────────────────────────────────────────────────────────────────
function endGame(room) {
  if (room.tickInterval) { clearInterval(room.tickInterval); room.tickInterval = null; }
  room.phase = 'results';

  const allPlayers = [
    ...Object.values(room.players),
    ...Object.values(room.bots),
  ].sort((a, b) => b.souls - a.souls);

  io.to(room.id).emit('game_over', { leaderboard: allPlayers });

  // Clean up room after 30s
  setTimeout(() => {
    rooms.delete(room.id);
    if (publicRoomId === room.id) publicRoomId = null;
  }, 30000);
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function startCountdown(room) {
  if (room.phase !== 'lobby') return;
  room.phase = 'countdown';
  room.countdown = 5;

  io.to(room.id).emit('countdown', { count: room.countdown });

  room.countdownTimer = setInterval(() => {
    room.countdown--;
    if (room.countdown <= 0) {
      clearInterval(room.countdownTimer);
      startGame(room);
    } else {
      io.to(room.id).emit('countdown', { count: room.countdown });
    }
  }, 1000);
}

// ── Socket events ─────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`👻 Connected: ${socket.id}`);

  // ── Join public matchmaking ──
  socket.on('join_public', ({ name }) => {
    const room = getOrCreatePublicRoom();
    joinRoom(socket, room, name);
  });

  // ── Create private room ──
  socket.on('create_private', ({ name }) => {
    const room = createRoom(true);
    joinRoom(socket, room, name);
    socket.emit('room_created', { roomId: room.id });
  });

  // ── Join private room ──
  socket.on('join_private', ({ name, roomId }) => {
    const room = rooms.get(roomId.toUpperCase());
    if (!room) { socket.emit('error', { message: 'Room not found' }); return; }
    if (room.phase !== 'lobby') { socket.emit('error', { message: 'Game already started' }); return; }
    joinRoom(socket, room, name);
  });

  // ── Player movement ──
  socket.on('move', ({ dir }) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.phase !== 'playing') return;
    const player = room.players[socket.id];
    if (!player) return;

    player.dir = dir;
    tryMove(player, dir, room.maze);

    const collected = checkSoulCollection(player, room.souls);
    if (collected.length) {
      io.to(roomId).emit('souls_collected', { playerId: socket.id, soulIds: collected, newTotal: player.souls });
    }

    const stolen = checkSoulStealing(player, { ...room.players, ...room.bots });
    if (stolen.length) {
      io.to(roomId).emit('souls_stolen', { by: socket.id, stolen });
    }
  });

  // ── Ready (host starts countdown) ──
  socket.on('ready_start', () => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.phase !== 'lobby') return;
    const humanCount = Object.keys(room.players).length;
    if (humanCount < MIN_PLAYERS_PVP && !room.isPrivate) return;
    startCountdown(room);
  });

  // ── Start solo PvE ──
  socket.on('start_pve', () => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.phase !== 'lobby') return;
    startCountdown(room);
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log(`💨 Disconnected: ${socket.id}`);
    const roomId = socketToRoom.get(socket.id);
    socketToRoom.delete(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    delete room.players[socket.id];
    io.to(roomId).emit('player_left', { playerId: socket.id });

    if (Object.keys(room.players).length === 0) {
      // Empty room — clean up
      if (room.tickInterval) clearInterval(room.tickInterval);
      if (room.countdownTimer) clearInterval(room.countdownTimer);
      rooms.delete(roomId);
      if (publicRoomId === roomId) publicRoomId = null;
    }
  });
});

function joinRoom(socket, room, name) {
  const playerCount = Object.keys(room.players).length;
  if (playerCount >= MAX_PLAYERS) {
    socket.emit('error', { message: 'Room is full' });
    return;
  }

  const colorIdx = playerCount;
  const player = createPlayer(socket.id, name || `SOUL_${playerCount + 1}`, colorIdx, playerCount);
  room.players[socket.id] = player;
  socketToRoom.set(socket.id, room.id);

  socket.join(room.id);
  socket.emit('joined_room', {
    roomId: room.id,
    playerId: socket.id,
    isPrivate: room.isPrivate,
    players: room.players,
  });
  socket.to(room.id).emit('player_joined', { player });

  // Auto-start public room when full
  if (!room.isPrivate && Object.keys(room.players).length >= MAX_PLAYERS && room.phase === 'lobby') {
    startCountdown(room);
  }
}

// ── REST: room info ───────────────────────────────────────────────────────────
app.get('/api/rooms/:id', (req, res) => {
  const room = rooms.get(req.params.id.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({
    id: room.id,
    phase: room.phase,
    playerCount: Object.keys(room.players).length,
    isPrivate: room.isPrivate,
  });
});

app.get('/api/health', (_, res) => res.json({ status: 'alive', rooms: rooms.size }));

server.listen(PORT, () => {
  console.log(`👻 SOUL HARVEST server running on port ${PORT}`);
});
