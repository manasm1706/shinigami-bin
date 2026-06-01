/**
 * SOUL HARVEST — Game Logic
 * Original maze game for Shinigami-bin
 */

const TICK_RATE = 100; // ms per game tick
const GAME_DURATION = 120000; // 2 minutes
const MAX_PLAYERS = 8;
const MIN_PLAYERS_PVP = 2;
const SOUL_COUNT = 30;
const SOUL_STEAL_RANGE = 1.5; // tiles
const MOVE_SPEED = 0.15; // tiles per tick
const BOT_THINK_INTERVAL = 8; // ticks between bot decisions

// ── Maze generation (recursive backtracker) ──────────────────────────────────
const MAZE_W = 21; // must be odd
const MAZE_H = 21;

function generateMaze() {
  const grid = Array.from({ length: MAZE_H }, () => Array(MAZE_W).fill(1)); // 1=wall

  function carve(x, y) {
    grid[y][x] = 0;
    const dirs = shuffle([[0,-2],[0,2],[-2,0],[2,0]]);
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < MAZE_W-1 && ny > 0 && ny < MAZE_H-1 && grid[ny][nx] === 1) {
        grid[y + dy/2][x + dx/2] = 0;
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);

  // Open a few extra passages for more interesting play
  for (let i = 0; i < 15; i++) {
    const x = 1 + Math.floor(Math.random() * ((MAZE_W-2)/2)) * 2;
    const y = 1 + Math.floor(Math.random() * ((MAZE_H-2)/2)) * 2;
    const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
    const [dx, dy] = dirs[Math.floor(Math.random() * 4)];
    const nx = x+dx, ny = y+dy;
    if (nx > 0 && nx < MAZE_W-1 && ny > 0 && ny < MAZE_H-1) {
      grid[ny][nx] = 0;
    }
  }

  return grid;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Spawn points (corners + midpoints) ───────────────────────────────────────
const SPAWN_POINTS = [
  {x:1,y:1}, {x:MAZE_W-2,y:1}, {x:1,y:MAZE_H-2}, {x:MAZE_W-2,y:MAZE_H-2},
  {x:Math.floor(MAZE_W/2),y:1}, {x:Math.floor(MAZE_W/2),y:MAZE_H-2},
  {x:1,y:Math.floor(MAZE_H/2)}, {x:MAZE_W-2,y:Math.floor(MAZE_H/2)},
];

// ── Soul placement ────────────────────────────────────────────────────────────
function placeSouls(maze) {
  const open = [];
  for (let y = 0; y < MAZE_H; y++)
    for (let x = 0; x < MAZE_W; x++)
      if (maze[y][x] === 0) open.push({x, y});

  const souls = [];
  const used = new Set();
  while (souls.length < SOUL_COUNT && open.length > 0) {
    const idx = Math.floor(Math.random() * open.length);
    const pos = open[idx];
    const key = `${pos.x},${pos.y}`;
    if (!used.has(key)) {
      used.add(key);
      souls.push({ id: souls.length, x: pos.x, y: pos.y, collected: false });
    }
    open.splice(idx, 1);
  }
  return souls;
}

// ── Bot AI ────────────────────────────────────────────────────────────────────
const BOT_NAMES = [
  'WRAITH-7', 'SPECTER-X', 'BANSHEE-3', 'PHANTOM-9',
  'REVENANT', 'POLTERGEIST', 'SHADE-6', 'LICH-KING'
];

function createBot(id, spawnIdx) {
  const spawn = SPAWN_POINTS[spawnIdx % SPAWN_POINTS.length];
  return {
    id,
    name: BOT_NAMES[id % BOT_NAMES.length],
    x: spawn.x,
    y: spawn.y,
    souls: 0,
    isBot: true,
    alive: true,
    color: id,
    dir: { x: 0, y: 0 },
    botTick: 0,
    targetSoul: null,
  };
}

function botThink(bot, gameState) {
  const { maze, souls, players } = gameState;

  // Find nearest uncollected soul
  let nearest = null;
  let nearestDist = Infinity;
  for (const soul of souls) {
    if (soul.collected) continue;
    const d = Math.abs(soul.x - bot.x) + Math.abs(soul.y - bot.y);
    if (d < nearestDist) { nearestDist = d; nearest = soul; }
  }

  if (!nearest) return { x: 0, y: 0 };

  // Simple pathfinding: move toward target, avoid walls
  const dx = nearest.x - bot.x;
  const dy = nearest.y - bot.y;

  const candidates = [];
  if (Math.abs(dx) >= Math.abs(dy)) {
    candidates.push({ x: Math.sign(dx), y: 0 });
    candidates.push({ x: 0, y: Math.sign(dy) });
    candidates.push({ x: -Math.sign(dx), y: 0 });
  } else {
    candidates.push({ x: 0, y: Math.sign(dy) });
    candidates.push({ x: Math.sign(dx), y: 0 });
    candidates.push({ x: 0, y: -Math.sign(dy) });
  }

  for (const dir of candidates) {
    const nx = Math.round(bot.x + dir.x);
    const ny = Math.round(bot.y + dir.y);
    if (nx >= 0 && nx < MAZE_W && ny >= 0 && ny < MAZE_H && maze[ny][nx] === 0) {
      return dir;
    }
  }

  // Random fallback
  const dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
  for (const dir of shuffle([...dirs])) {
    const nx = Math.round(bot.x + dir.x);
    const ny = Math.round(bot.y + dir.y);
    if (nx >= 0 && nx < MAZE_W && ny >= 0 && ny < MAZE_H && maze[ny][nx] === 0) {
      return dir;
    }
  }
  return { x: 0, y: 0 };
}

// ── Movement ──────────────────────────────────────────────────────────────────
function tryMove(player, dir, maze) {
  if (!dir || (dir.x === 0 && dir.y === 0)) return;

  const speed = MOVE_SPEED;
  const nx = player.x + dir.x * speed;
  const ny = player.y + dir.y * speed;

  // Check wall collision (check the tile the center is moving into)
  const tileX = Math.round(nx);
  const tileY = Math.round(ny);

  if (tileX >= 0 && tileX < MAZE_W && tileY >= 0 && tileY < MAZE_H) {
    if (maze[tileY][tileX] === 0) {
      player.x = nx;
      player.y = ny;
    } else {
      // Try sliding along wall
      const slideX = player.x + dir.x * speed;
      const slideTileX = Math.round(slideX);
      if (slideTileX >= 0 && slideTileX < MAZE_W && maze[Math.round(player.y)][slideTileX] === 0) {
        player.x = slideX;
      }
      const slideY = player.y + dir.y * speed;
      const slideTileY = Math.round(slideY);
      if (slideTileY >= 0 && slideTileY < MAZE_H && maze[slideTileY][Math.round(player.x)] === 0) {
        player.y = slideY;
      }
    }
  }
}

// ── Soul collection ───────────────────────────────────────────────────────────
function checkSoulCollection(player, souls) {
  const collected = [];
  for (const soul of souls) {
    if (soul.collected) continue;
    const d = Math.sqrt((soul.x - player.x) ** 2 + (soul.y - player.y) ** 2);
    if (d < 0.8) {
      soul.collected = true;
      player.souls++;
      collected.push(soul.id);
    }
  }
  return collected;
}

// ── Soul stealing ─────────────────────────────────────────────────────────────
function checkSoulStealing(attacker, players) {
  const stolen = [];
  for (const [id, target] of Object.entries(players)) {
    if (id === attacker.id || target.isBot === attacker.isBot) continue;
    if (target.souls <= 0) continue;
    const d = Math.sqrt((target.x - attacker.x) ** 2 + (target.y - attacker.y) ** 2);
    if (d < SOUL_STEAL_RANGE) {
      const amount = Math.min(target.souls, Math.ceil(target.souls * 0.3));
      target.souls -= amount;
      attacker.souls += amount;
      stolen.push({ from: id, amount });
    }
  }
  return stolen;
}

module.exports = {
  MAZE_W, MAZE_H, MAX_PLAYERS, MIN_PLAYERS_PVP,
  GAME_DURATION, TICK_RATE, SOUL_COUNT,
  generateMaze, placeSouls, createBot,
  botThink, tryMove, checkSoulCollection, checkSoulStealing,
  SPAWN_POINTS, shuffle,
};
