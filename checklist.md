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

### Realm Behavior System
- [x] `RealmConfig` type with `type`, `effectsLevel`, `allowRituals` fields
- [x] `backend/data/realmConfig.js` — single source of truth for realm metadata
- [x] `GET /api/realms` — exposes realm configs to frontend
- [x] `useRealmEffects(effectsLevel)` hook — broadcasts realm effect level changes
- [x] `useRituals(allowRituals)` — blocks ritual execution in non-ritual realms
- [x] `ChatPage` wires active realm metadata to effect and ritual systems
- [x] `EffectSystem` extended with `realm_effects_changed` event type

---

## 🚧 Phase 1: Persistent Storage + Real Auth

### Database (PostgreSQL + NeonDB + Prisma)
- [x] Set up NeonDB project and get connection string
- [x] Install Prisma + adapter-neon in backend
- [x] Define Prisma schema: User, Conversation, ConversationMember, Message, Prophecy
- [x] Run initial migration (20260316_init applied to NeonDB)
- [x] Prisma client singleton with Neon adapter (backend/lib/prisma.js)
- [x] Prophecies route updated to use Prisma (with guest fallback)
- [x] Replace messageStore.js with Prisma message queries (in-memory still active as fallback)
- [x] Add database health check to /api/health

### Real Authentication
- [x] bcryptjs password hashing
- [x] POST /api/auth/register (username, email, password) → JWT
- [x] POST /api/auth/login → JWT
- [x] GET /api/auth/me — token verification
- [x] JWT middleware (backend/middleware/auth.js)
- [x] useAuth.tsx updated — stores JWT + user object in localStorage
- [x] Login.tsx updated — register/login toggle with real API calls
- [x] services/api.ts — apiFetch helper with auto Authorization header
- [x] Protect Socket.IO connection with JWT handshake

---

## 🚧 Phase 2: Conversations (DMs + Group Rooms)

### Backend
- [x] GET /api/conversations — list user's conversations
- [x] POST /api/conversations — create DM or group room
- [x] GET /api/conversations/:id/messages — paginated history
- [x] POST /api/conversations/:id/members — add member to group
- [x] Socket.IO rooms mapped to conversationId (not just realm name)
- [x] typing_start / typing_stop events per conversation
- [x] online_users event per conversation

### Frontend
- [x] Sidebar: show DMs + group rooms + realm channels
- [x] ConversationList component (integrated into Sidebar)
- [x] DMConversation view
- [x] GroupRoom view
- [x] Typing indicator component
- [x] Online users list per conversation
- [x] Create conversation modal (group)

---

## 🚧 Phase 3: ASCII GIF System

### ASCII GIF Player
- [x] AsciiGifPlayer component (frames: string[], frameDelay: number)
- [x] useInterval hook for frame cycling
- [x] Loop mode toggle
- [x] Pause/play controls

### ASCII GIF Creator
- [x] AsciiGifCreator component
- [x] Multi-frame textarea editor (add/remove frames)
- [x] Frame delay slider
- [x] Live preview using AsciiGifPlayer
- [x] Save GIF to database (POST /api/ascii-gifs)
- [x] Load saved GIFs (GET /api/ascii-gifs)

### Video-to-ASCII Pipeline
- [x] Backend: POST /api/ascii-gifs/convert (accepts image upload)
- [x] Resize frames to target resolution (e.g. 80x40)
- [x] Map pixel brightness to ASCII chars: `@#%*+=-:. `
- [ ] Optional: colored ASCII using styled spans (RGB from pixel)
- [ ] Return frame array + suggested frameDelay

### Message Integration
- [x] ascii_gif message type in Message schema
- [x] Render AsciiGifPlayer inline in ChatWindow for ascii_gif messages
- [x] Send ASCII GIF button in MessageInput

---

## 🚧 Phase 4: Messaging Polish

- [x] Message reactions (emoji, stored in DB)
- [x] Message search (GET /api/conversations/:id/messages?q=)
- [x] Message pagination (cursor-based, load older messages on scroll)
- [x] Virtual scrolling for large message lists
- [x] Sound effects (ritual completion, new message)
- [x] Unread message count per conversation

---

## 🚧 Phase 5: Additional Rituals + MCP Expansion

- [x] Tarot card reading ritual
- [x] Crystal ball ritual
- [x] Rune casting ritual
- [x] Real weather API in MCP server (Open-Meteo + Nominatim geocoding, no API key)
- [ ] Astrology MCP server
- [x] Ritual results shareable as messages

---

*Last updated: Production planning phase*

---

## ✅ Phase 6 Part 1: UX Fixes + EKG Effect

- [x] Fix `layout::before/after` z-index blocking mouse clicks on header (was z-index 999, now z-index 1 with pointer-events: none)
- [x] Rename EFFECTS button → CONTROLS
- [x] Add keyboard hint in CONTROLS panel: Tab = next · Shift+Tab = prev · Enter = select
- [x] EKGOverlay component — scrolling neon EKG waveform on canvas
- [x] Grid background (faint green lines)
- [x] Vital signs HUD (heart rate BPM + SpO2 %)
- [x] Scanning horizontal line sweeping top-to-bottom
- [x] Random screen glitch at intervals 1s–5min (random uniform)
- [x] Glitch: chromatic aberration tears + color shift + waveform turns red
- [x] EKGOverlay mounted globally in Layout behind all content (z-index: 2, pointer-events: none)

## 🚧 Phase 6 Part 2: Realm Redesign (Communities)

- [x] Add `Community` + `CommunityMember` + `CommunityChannel` Prisma models
- [x] `GET/POST /api/communities` routes
- [x] `POST /api/communities/:id/join` + `POST /api/communities/:id/leave` routes
- [x] `GET/POST /api/communities/:id/channels` routes
- [x] `CommunityBrowser` component (Beyond realm view — browse/join/create communities + channels)
- [x] Living realm = DMs + Groups (unchanged)
- [x] Unknown realm = global realm chat (unchanged)
- [x] Beyond realm = CommunityBrowser (new)
- [x] ChatPage routes Beyond realm to CommunityBrowser
- [x] Community channel selection opens conversation view

## ✅ Phase 7: ASCII GIF v2 — Video Support + Monochrome Green

- [x] Fix `express.json()` 100kb limit → 50mb (was causing 413 misread as auth error)
- [x] `POST /api/ascii-gifs/convert-video` — multer upload + fluent-ffmpeg frame extraction + sharp ASCII conversion
- [x] Video crop controls (start/end time sliders, max 10 seconds enforced)
- [x] Monochrome green palette — 10 shades `#001a00` → `#00ff41` mapped by brightness
- [x] `AsciiGifPlayer` — always loops, per-character green shade rendering via colored spans
- [x] `AsciiGifCreator` — 3-tab UI (Draw / IMG→ASCII / VIDEO→ASCII), progress bar, 10s duration badge
- [x] `convertVideoToAscii()` service using `FormData` + `XMLHttpRequest` for upload progress
- [x] Backend enforces 10s max: `frameCount * frameDelay ≤ 10000ms`

## ✅ Phase 7: Polish + Production

- [x] Error boundary component (wraps entire app + ChatPage)
- [x] Loading skeleton components (MessageSkeleton, ConversationSkeleton)
- [x] Toast notification system with useToast hook
- [x] Socket error events dispatched to Toast via CustomEvent
- [x] PWA manifest.json + favicon.svg
- [x] index.html — proper title, meta viewport, theme-color, apple-mobile-web-app tags
- [x] Mobile responsive: sidebar drawer on mobile (< 640px), ritual panel full-screen
- [x] AsciiGif.frames migrated from JSON string → native PostgreSQL String[] array
- [x] Rate limiting errors surfaced via Toast (socket error → CustomEvent → useToast)
- [x] ARIA roles on Sidebar nav (role=navigation, aria-label, aria-current)
