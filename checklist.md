# Shinigami-bin Development Checklist

## ✅ Completed Features

### Core Architecture
- [x] React + TypeScript + Vite frontend
- [x] Node.js + Express + Socket.IO backend
- [x] Feature-based directory structure (app/, auth/, chat/, rituals/, effects/, services/)
- [x] React Router with /login and /chat routes
- [x] Layout wrapper with header and logout

### Real-time Chat
- [x] Socket.IO realm-based messaging (Living, Beyond, Unknown)
- [x] join_realm, send_message, receive_message events
- [x] In-memory message history (per realm, 200 max)
- [x] User presence tracking per realm
- [x] Connection status indicators
- [x] Message history on realm join

### Authentication
- [x] Guest login (username + localStorage)
- [x] AuthContext with useAuth hook
- [x] Protected routes (redirect to /login if unauthenticated)
- [x] Logout functionality

### Ritual System
- [x] RitualRegistry pattern (centralized registry)
- [x] Daily Fortune ritual + backend endpoint
- [x] Weather Omen ritual + MCP bridge backend
- [x] Wheel of Fate mini-game
- [x] Cooldown management
- [x] Ritual result history
- [x] Effect triggers on ritual completion

### Visual Effects
- [x] Event-driven EffectSystem
- [x] GhostOverlay (particles, wisps, fade in/out)
- [x] CRT scanline overlay
- [x] GlitchText component
- [x] EffectSettings panel (toggleable)
- [x] Intensity levels (low/medium/high)
- [x] prefers-reduced-motion support

### MCP Integration
- [x] Weather-Omen MCP server definition (.kiro/mcp/weather-omen/)
- [x] Backend MCP bridge (GET /api/omens/weather)
- [x] MCPStatus component
- [x] Graceful fallback on MCP failure

### Security & Validation
- [x] Input validation (username, message, city, realm)
- [x] Rate limiting (5 messages / 3s per socket)
- [x] Memory-capped message store
- [x] CORS configured for localhost:5173

### Prophecies
- [x] POST /api/prophecies + GET /api/prophecies
- [x] Ominous language generator
- [x] ProphecyCard frontend component
- [x] GhostOverlay trigger on prophecy creation

---

## 🚧 Phase 1: Persistent Storage + Real Auth

### Database (PostgreSQL + NeonDB + Prisma)
- [x] Set up NeonDB project and get connection string
- [x] Install Prisma + adapter-neon in backend
- [x] Define Prisma schema: User, Conversation, ConversationMember, Message, Prophecy
- [x] Run initial migration (20260316_init applied to NeonDB)
- [x] Prisma client singleton with Neon adapter (backend/lib/prisma.js)
- [x] Prophecies route updated to use Prisma (with guest fallback)
- [ ] Replace messageStore.js with Prisma message queries (in-memory still active as fallback)
- [ ] Add database health check to /api/health

### Real Authentication
- [x] bcryptjs password hashing
- [x] POST /api/auth/register (username, email, password) → JWT
- [x] POST /api/auth/login → JWT
- [x] GET /api/auth/me — token verification
- [x] JWT middleware (backend/middleware/auth.js)
- [x] useAuth.tsx updated — stores JWT + user object in localStorage
- [x] Login.tsx updated — register/login toggle with real API calls
- [x] services/api.ts — apiFetch helper with auto Authorization header
- [ ] Protect Socket.IO connection with JWT handshake

---

## 🚧 Phase 2: Conversations (DMs + Group Rooms)

### Backend
- [ ] GET /api/conversations — list user's conversations
- [ ] POST /api/conversations — create DM or group room
- [ ] GET /api/conversations/:id/messages — paginated history
- [ ] POST /api/conversations/:id/members — add member to group
- [ ] Socket.IO rooms mapped to conversationId (not just realm name)
- [ ] typing_start / typing_stop events per conversation
- [ ] online_users event per conversation

### Frontend
- [ ] Sidebar: show DMs + group rooms + realm channels
- [ ] ConversationList component
- [ ] DMConversation view
- [ ] GroupRoom view
- [ ] Typing indicator component
- [ ] Online users list per conversation
- [ ] Create conversation modal (DM or group)

---

## 🚧 Phase 3: ASCII GIF System

### ASCII GIF Player
- [ ] AsciiGifPlayer component (frames: string[], frameDelay: number)
- [ ] useInterval hook for frame cycling
- [ ] Loop mode toggle
- [ ] Pause/play controls

### ASCII GIF Creator
- [ ] AsciiGifCreator component
- [ ] Multi-frame textarea editor (add/remove frames)
- [ ] Frame delay slider
- [ ] Live preview using AsciiGifPlayer
- [ ] Save GIF to database (POST /api/ascii-gifs)
- [ ] Load saved GIFs (GET /api/ascii-gifs)

### Video-to-ASCII Pipeline
- [ ] Backend: POST /api/ascii-gifs/convert (accepts video upload)
- [ ] Extract frames using ffmpeg or canvas
- [ ] Resize frames to target resolution (e.g. 80x40)
- [ ] Map pixel brightness to ASCII chars: `@#%*+=-:. `
- [ ] Optional: colored ASCII using styled spans (RGB from pixel)
- [ ] Return frame array + suggested frameDelay

### Message Integration
- [ ] ascii_gif message type in Message schema
- [ ] Render AsciiGifPlayer inline in ChatWindow for ascii_gif messages
- [ ] Send ASCII GIF button in MessageInput

---

## 🚧 Phase 4: Messaging Polish

- [ ] Message reactions (emoji, stored in DB)
- [ ] Message search (GET /api/conversations/:id/messages?q=)
- [ ] Message pagination (cursor-based, load older messages on scroll)
- [ ] Virtual scrolling for large message lists
- [ ] Sound effects (ritual completion, new message)
- [ ] Unread message count per conversation

---

## 🚧 Phase 5: Additional Rituals + MCP Expansion

- [ ] Tarot card reading ritual
- [ ] Crystal ball ritual
- [ ] Rune casting ritual
- [ ] Real weather API in MCP server (replace mock)
- [ ] Astrology MCP server
- [ ] Ritual results shareable as messages

---

*Last updated: Production planning phase*
