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
// Takes frames and loops them at frameDelay ms
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

Pipeline steps:
1. Extract frames (ffmpeg or canvas API)
2. Resize to target resolution (e.g. 80×40 chars)
3. Map pixel brightness → ASCII char from `@#%*+=-:. `
4. Optional: wrap chars in `<span style="color: rgb(r,g,b)">` for colored output
5. Return frame array

### Message Integration
- `type: "ascii_gif"` in Message schema
- ChatWindow renders `<AsciiGifPlayer>` for ascii_gif messages
- MessageInput has "Insert ASCII GIF" button

---

## Phase 4: Messaging Polish (v0.6.0)

- Message reactions (emoji, stored in DB as Reaction model)
- Message search (full-text, per conversation)
- Cursor-based pagination for message history
- Virtual scrolling in ChatWindow
- Unread message badges per conversation
- Sound effects (ritual completion, incoming message)

---

## Phase 5: Additional Rituals + Real MCP (v0.7.0)

- Tarot card reading ritual (virtual deck, 3-card spread)
- Crystal ball ritual (vision generation)
- Rune casting ritual (Norse rune system)
- Real weather API in MCP server (replace mock fetch)
- Ritual results shareable as chat messages
- Astrology MCP server (optional)

---

## Architecture Principles (Preserved Throughout)

- UI aesthetic stays unchanged — supernatural terminal style is intentional
- Ritual system stays modular (registry pattern, pluggable execute())
- Effects stay decoupled from business logic (event-driven EffectSystem)
- MCP bridge stays in backend — frontend never calls MCP directly
- Socket.IO stays event-driven — no REST polling for real-time data
- `import type` for all TypeScript interface imports (verbatimModuleSyntax)

---

*Last updated: Production planning phase*
