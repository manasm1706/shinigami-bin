# Shinigami-bin Architecture

## System Overview

Shinigami-bin is a supernatural-themed real-time messaging platform. The architecture is built around three pillars: real-time communication via Socket.IO, a modular ritual/feature system, and an event-driven visual effects engine. The UI aesthetic (green-on-black terminal, CRT effects, glitch text) is intentional and permanent.

---

## Frontend Architecture

### Stack
- React 19 + TypeScript + Vite
- Socket.IO Client
- React Router v6

### Directory Structure
```
frontend/src/
├── app/              # Router, Layout, App shell
├── auth/             # Login, useAuth, AuthContext
├── chat/             # ChatPage, useChat, ChatWindow, MessageInput, Sidebar
├── rituals/          # RitualRegistry, useRituals, FortuneCard, WeatherOmenCard, WheelOfFate
├── effects/          # EffectSystem, GhostOverlay, CRTOverlay, GlitchText, useEffects
├── services/         # api.ts, messages.ts, fortune.ts, weatherOmen.ts, prophecies.ts
└── types/            # Shared TypeScript types
```

### State Management
- Local state: `useState` for component-specific data
- Global state: React Context (AuthContext, EffectSettingsContext)
- Real-time state: `useChat` hook (Socket.IO events → React state)
- No Redux — Context + custom hooks is sufficient

### Routing
```
/login   → Login (public)
/        → redirect to /chat
/chat    → ChatPage (protected, wrapped in Layout)
*        → redirect to /chat
```

---

## Backend Architecture

### Stack
- Node.js + Express
- Socket.IO
- Prisma ORM (planned, currently in-memory)
- PostgreSQL on NeonDB (planned)

### Directory Structure
```
backend/
├── index.js           # Express + Socket.IO server
├── routes/
│   ├── messages.js    # Legacy REST (to be replaced by conversation routes)
│   ├── fortune.js     # GET /api/fortune/daily
│   ├── omens.js       # GET /api/omens/weather (MCP bridge)
│   └── prophecies.js  # POST/GET /api/prophecies
├── data/
│   ├── messageStore.js  # In-memory (to be replaced by Prisma)
│   └── prophecies.js    # In-memory (to be replaced by Prisma)
└── utils/
    ├── fortunes.js      # Fortune text generation
    ├── validation.js    # Input validation helpers
    └── inputValidation.js
```

### REST API
```
GET  /api/health
GET  /api/fortune/daily?username=NAME
GET  /api/omens/weather?city=CITY
GET  /api/prophecies
POST /api/prophecies

# Planned (Phase 1-2):
POST /api/auth/register
POST /api/auth/login
GET  /api/conversations
POST /api/conversations
GET  /api/conversations/:id/messages
POST /api/conversations/:id/members

# Planned (Phase 3):
POST /api/ascii-gifs/convert
GET  /api/ascii-gifs
POST /api/ascii-gifs
```

### Socket.IO Events
```
Client → Server:
  join_realm(realm, username)         # current
  send_message(realm, sender, text)   # current
  join_conversation(conversationId)   # planned
  send_message_v2(conversationId, content, type)  # planned
  typing_start(conversationId)        # planned
  typing_stop(conversationId)         # planned

Server → Client:
  receive_message(message)
  realm_history(realm, messages)
  user_joined(username, realm)
  user_left(username, realm)
  realm_users(realm, users)
  typing(conversationId, username)    # planned
  online_users(conversationId, users) # planned
```

---

## Database Schema (Prisma — Phase 1)

```prisma
model User {
  id           String   @id @default(cuid())
  username     String   @unique
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  messages     Message[]
  memberships  ConversationMember[]
}

model Conversation {
  id        String   @id @default(cuid())
  type      String   // "dm" | "group" | "realm"
  name      String?
  realmId   String?
  createdAt DateTime @default(now())
  members   ConversationMember[]
  messages  Message[]
}

model ConversationMember {
  id             String       @id @default(cuid())
  userId         String
  conversationId String
  joinedAt       DateTime     @default(now())
  user           User         @relation(fields: [userId], references: [id])
  conversation   Conversation @relation(fields: [conversationId], references: [id])
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  senderId       String
  content        String
  type           String   @default("text") // "text" | "ascii_gif"
  createdAt      DateTime @default(now())
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  sender         User         @relation(fields: [senderId], references: [id])
}

model AsciiGif {
  id         String   @id @default(cuid())
  creatorId  String
  frames     String[] // array of ASCII frame strings
  frameDelay Int      @default(150)
  width      Int
  height     Int
  createdAt  DateTime @default(now())
}
```

---

## Effect System Architecture

### Event-Driven Design
Effects are completely decoupled from business logic. Rituals emit events; UI components listen.

```typescript
// Trigger (from ritual completion)
effectSystem.triggerEffect('ghost_dramatic', { ritualType: 'wheel_of_fate' });

// Listen (in UI component)
useEffect(() => {
  return addListener('ghost_dramatic', (payload) => setGhostActive(true));
}, []);
```

### Effect → Ritual Mapping
| Ritual | Effect | Duration | Intensity |
|--------|--------|----------|-----------|
| Fortune | ghost_subtle | 1.5s | low |
| Weather Omen | ghost_medium | 2.5s | medium |
| Wheel of Fate | ghost_dramatic | 4s | high + vortex |

### Effect Types
- `GhostOverlay` — particles, wisps, fade in/out
- `CRTOverlay` — scanlines, flicker, screen curvature
- `GlitchText` — text corruption with color channel separation
- All effects are toggleable via EffectSettings

---

## Ritual System Architecture

### Registry Pattern
```typescript
class RitualRegistry {
  register(ritual: RitualDefinition): void
  execute(id: string, params?: unknown): Promise<RitualResult>
  isOnCooldown(id: string): boolean
  getHistory(): RitualResult[]
}

interface RitualDefinition {
  id: string
  name: string
  cooldown?: number
  requiredParams?: string[]
  execute(params?: unknown): Promise<RitualResult>
}
```

### Adding a New Ritual
```typescript
ritualRegistry.register({
  id: 'tarot_reading',
  name: 'Tarot Reading',
  cooldown: 120_000,
  async execute() {
    const cards = drawCards(3);
    return { success: true, data: { cards } };
  }
});
```

---

## MCP Integration Architecture

### Bridge Pattern
```
Frontend → REST API → Backend MCP Bridge → MCP Server (stdio) → External API
```

The backend is the only layer that communicates with MCP servers. The frontend calls a normal REST endpoint.

### MCP Server Communication
```javascript
// Where real MCP integration goes (currently mocked in omens.js)
const { Client } = require('@modelcontextprotocol/sdk/client');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio');

const transport = new StdioClientTransport({
  command: 'node',
  args: ['./.kiro/mcp/weather-omen/index.js']
});
const client = new Client({ name: 'shinigami-backend' });
await client.connect(transport);
const result = await client.request({
  method: 'tools/call',
  params: { name: 'get_weather_omen', arguments: { city } }
});
```

---

## ASCII GIF Pipeline (Phase 3)

```
Video Upload → Frame Extraction → Resize → Brightness Map → ASCII Frames → Store/Send
```

### Brightness-to-ASCII Mapping
```javascript
const ASCII_CHARS = '@#%*+=-:. ';
// pixel brightness 0-255 → index into ASCII_CHARS
const char = ASCII_CHARS[Math.floor((brightness / 255) * (ASCII_CHARS.length - 1))];
```

### Colored ASCII (optional)
```html
<!-- Each char wrapped in a span with the original pixel color -->
<span style="color: rgb(120, 80, 200)">@</span>
```

### AsciiGifPlayer Component
```tsx
interface AsciiGifPlayerProps {
  frames: string[]
  frameDelay: number
  loop?: boolean
}
// Uses useInterval to cycle frames, renders current frame in <pre>
```

---

## Security

### Current
- Input validation on all user inputs (username, message, city, realm)
- Rate limiting: 5 messages / 3s per socket
- CORS restricted to localhost:5173
- Memory-capped message store (200 per realm)

### Planned (Phase 1)
- bcrypt password hashing
- JWT authentication (access tokens)
- JWT middleware on protected routes
- Socket.IO handshake auth (JWT in socket.handshake.auth)
- Refresh token rotation

---

## Deployment (Future)

```
Internet → Load Balancer → Express + Socket.IO servers
                        → NeonDB (PostgreSQL)
                        → Redis (sessions, presence, rate limits)
```

- Socket.IO sticky sessions required for horizontal scaling
- Redis adapter for Socket.IO when running multiple instances
- NeonDB handles connection pooling at the DB layer

---

*Last updated: Production planning phase*
