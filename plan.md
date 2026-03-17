# Shinigami-bin Development Plan

## Current State (v0.2.0)

The prototype is feature-complete as a demo. The following are working:
- Real-time realm-based chat via Socket.IO
- Guest login (localStorage)
- Ritual system: Fortune, Weather Omen (MCP bridge), Wheel of Fate
- Visual effects: GhostOverlay, CRT, GlitchText
- Prophecies system
- Feature-based frontend architecture (app/, auth/, chat/, rituals/, effects/)
- React Router with /login and /chat routes

All storage is in-memory. Auth is guest-only. Conversations are realm-only (no DMs or groups).

---

## Phase 0.5: Realm Behavior System (in progress)

Goal: Upgrade realms from simple Socket.IO room partitions into behavior-driven environments.

### Realm Metadata Model
Each realm now carries:
- `id` — unique identifier
- `name` — display name
- `type` — `social` | `experimental` | `system`
- `effectsLevel` — `low` | `medium` | `high`
- `allowRituals` — boolean
- `description` — flavor text

### Realm Behaviors
| Realm   | Type         | effectsLevel | allowRituals | Purpose                                      |
|---------|--------------|--------------|--------------|----------------------------------------------|
| Living  | social       | low          | false        | Default chat, minimal effects, normal comms  |
| Beyond  | experimental | high         | true         | Playground: full rituals, strong effects     |
| Unknown | system       | medium       | false        | System/bot space, experimental features      |

### Changes Made
- `RealmConfig` type added to `frontend/src/types/index.ts` (replaces bare `Realm`)
- `useRealmEffects(effectsLevel)` hook — broadcasts `realm_effects_changed` event when realm switches
- `useRituals(allowRituals)` — blocks ritual execution when `allowRituals: false`
- `backend/data/realmConfig.js` — single source of truth for realm metadata
- `GET /api/realms` — exposes realm configs to frontend
- `ChatPage` wires `useRealmEffects` to active realm's `effectsLevel`

### Conversation Architecture (foundation)
Realms are treated as default system conversations. The Socket.IO room naming (`realm_${id}`) is preserved for backward compatibility. Future conversation types (DMs, groups) will use `conversation_${id}` rooms.

---

## Phase 1: Persistent Storage + Real Auth (v0.3.0)

Goal: Replace in-memory storage with PostgreSQL via Prisma. Add real signup/login with JWT.

### Database Schema (Prisma)

```prisma
model User {
  id            String   @id @default(cuid())
  username      String   @unique
  email         String   @unique
  passwordHash  String
  createdAt     DateTime @default(now())
  messages      Message[]
  memberships   ConversationMember[]
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
```

### Auth Endpoints
- `POST /api/auth/register` — create account, return JWT
- `POST /api/auth/login` — verify credentials, return JWT
- JWT middleware on all protected routes and Socket.IO handshake

### Migration
- Replace `messageStore.js` with Prisma `Message` queries
- Replace `prophecies.js` in-memory store with Prisma model
- Keep Socket.IO event names the same — only swap the storage layer

---

## Phase 2: Multi-Conversation Messaging (v0.4.0)

Goal: Evolve from realm-only chat to full DM + group room + realm channel system.

### Conversation Types
- `realm` — existing Living/Beyond/Unknown channels (auto-created, open to all)
- `dm` — private 1:1 conversation between two users
- `group` — user-created room with named membership

### Unified Conversation Model
All conversation types map to a single `Conversation` model. Socket.IO rooms use `conversation_${conversationId}`. Realms are seeded as system conversations on startup.

### Socket.IO Changes
- Rooms mapped to `conversation_${conversationId}` instead of `realm_${name}`
- New events:
  - `typing_start` / `typing_stop` — per conversation
  - `online_users` — list of online members per conversation
  - `conversation_created` — notify members of new DM/group

### REST API Additions
```
GET  /api/conversations              — list user's conversations
POST /api/conversations              — create DM or group
GET  /api/conversations/:id/messages — paginated message history
POST /api/conversations/:id/members  — add member to group
```

### Frontend Changes
- Sidebar shows three sections: Realms, Groups, DMs
- ConversationList component replaces static realm list
- Typing indicator component (debounced, per conversation)
- Online users list per conversation
- Create conversation modal

---

## Phase 3: ASCII GIF System (v0.5.0)

Goal: Let users create and share animated ASCII art inside chats.

### Components

**AsciiGifPlayer**
```tsx
<AsciiGifPlayer frames={['frame1', 'frame2']} frameDelay={150} loop />
```

**AsciiGifCreator**
- Multi-frame textarea editor
- Frame delay slider
- Live preview via AsciiGifPlayer
- Save to DB / send to chat

**Video-to-ASCII Pipeline (backend)**
```
POST /api/ascii-gifs/convert
  ← video file upload
  → { frames: string[], frameDelay: number, width: number, height: number }
```

---

## Phase 4: Messaging Polish (v0.6.0)

- Message reactions (emoji, stored in DB)
- Message search (full-text, per conversation)
- Cursor-based pagination for message history
- Virtual scrolling in ChatWindow
- Unread message badges per conversation
- Sound effects (ritual completion, incoming message)

---

## Phase 5: Additional Rituals + Real MCP (v0.7.0)

- Tarot card reading ritual
- Crystal ball ritual
- Rune casting ritual
- Real weather API in MCP server (replace mock)
- Astrology MCP server
- Ritual results shareable as chat messages

---

## Architecture Principles (Preserved Throughout)

- UI aesthetic stays unchanged — supernatural terminal style is intentional
- Ritual system stays modular (registry pattern, pluggable execute())
- Effects stay decoupled from business logic (event-driven EffectSystem)
- Realm behavior is driven by metadata, not hardcoded conditionals
- MCP bridge stays in backend — frontend never calls MCP directly
- Socket.IO stays event-driven — no REST polling for real-time data
- `import type` for all TypeScript interface imports (verbatimModuleSyntax)

---

*Last updated: Phase 0.5 — Realm Behavior System*
