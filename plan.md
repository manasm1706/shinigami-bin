# Shinigami-bin Development Plan

## Current State (v0.6.0)

The app is now a fully-featured real-time chat platform with persistent storage, real auth,
multi-conversation messaging, ASCII GIF creation/sharing, and messaging polish.

---

## Changelog

### Phase 0.5 → Phase 1 (v0.2.0 → v0.3.0): Persistent Storage + Real Auth

**What changed:**

- `backend/data/messageStore.js` — was: sole message store (in-memory array). Now: fallback only; Prisma DB is primary for authenticated users.
- `backend/data/prophecies.js` — was: in-memory prophecy array. Now: replaced by Prisma `Prophecy` model with full DB persistence.
- `backend/lib/prisma.js` — was: did not exist. Now: Prisma client singleton using Neon adapter.
- `backend/prisma/schema.prisma` — was: did not exist. Now: defines `User`, `Conversation`, `ConversationMember`, `Message`, `Prophecy` models.
- `backend/routes/auth.js` — was: did not exist. Now: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` with bcrypt + JWT.
- `backend/middleware/auth.js` — was: did not exist. Now: `requireAuth` middleware that verifies JWT on protected routes.
- `backend/index.js` (Socket.IO middleware) — was: no auth on socket connections. Now: JWT handshake middleware attaches `socket.userId` and `socket.username`.
- `frontend/src/auth/useAuth.tsx` — was: guest-only (username in localStorage). Now: stores JWT + full `User` object, exposes `token` and `user`.
- `frontend/src/auth/Login/Login.tsx` — was: single username input. Now: register/login toggle with email + password fields, real API calls.
- `frontend/src/services/api.ts` — was: did not exist. Now: `apiFetch` helper that auto-injects `Authorization: Bearer <token>` header.
- `frontend/src/services/socket.ts` — was: plain socket connection. Now: passes JWT token in `socket.handshake.auth`.

---

### Phase 1 → Phase 2 (v0.3.0 → v0.4.0): Multi-Conversation Messaging

**What changed:**

- `backend/routes/conversations.js` — was: did not exist. Now: full CRUD for conversations (`GET /`, `POST /`, `GET /:id/messages`, `POST /:id/members`).
- `backend/index.js` (Socket.IO events) — was: only `join_realm` / `send_message` / `realm_*` events. Now: added `join_conversation`, `send_conversation_message`, `typing_start`, `typing_stop`, `online_users` broadcast.
- `frontend/src/chat/ChatPage.tsx` — was: empty file (0 bytes). Now: full page component wiring realms, DM/group conversations, ritual panels, effects, typing indicators, and sound effects.
- `frontend/src/chat/useChat.ts` — was: realm-only socket hook. Now: supports `joinConversation`, `sendMessage(text, conversationId?)`, `sendAsciiGif`, `toggleReaction`, `unreadCounts`, `reaction_updated` socket event.
- `frontend/src/chat/components/MessageInput/MessageInput.tsx` — was: no typing indicator support. Now: debounced `onTypingStart`/`onTypingStop` callbacks, `onSendAsciiGif` prop, GIF button.
- `frontend/src/chat/components/Sidebar/Sidebar.tsx` — was: static realm list only. Now: three sections (Realms, Groups, DMs) with unread badges, create group modal.
- `frontend/src/chat/useConversations.ts` — was: did not exist. Now: `fetchConversations`, `startDM`, `createGroup` with optimistic state updates.
- `frontend/src/services/conversations.ts` — was: did not exist. Now: `getConversations`, `createConversation`, `getConversationMessages`, `addConversationMember`.
- `frontend/src/types/index.ts` — was: `Realm` type only. Now: `RealmConfig`, `Conversation`, `ConversationMember`, `ConversationType` types added.

---

### Phase 2 → Phase 3 (v0.4.0 → v0.5.0): ASCII GIF System

**What changed:**

- `backend/prisma/schema.prisma` — was: no `AsciiGif` or `MessageReaction` models. Now: `AsciiGif` model (frames as JSON string, frameDelay, width, height) and `MessageReaction` model added; `Message` gained `asciiGifId` FK and `reactions` relation.
- `backend/routes/asciiGifs.js` — was: did not exist. Now: `GET /api/ascii-gifs`, `POST /api/ascii-gifs`, `GET /api/ascii-gifs/:id`, `POST /api/ascii-gifs/convert` (image-to-ASCII via `sharp`).
- `backend/index.js` (`send_message` / `send_conversation_message`) — was: text-only. Now: accepts `type: 'ascii_gif'` and `asciiGifId`, fetches gif frames and attaches to broadcast payload.
- `backend/routes/conversations.js` (GET messages) — was: no `asciiGif` or `reactions` in response. Now: includes `asciiGif` data and aggregated `reactions` per message.
- `frontend/src/ascii/AsciiGifPlayer/` — was: did not exist. Now: `AsciiGifPlayer` component with play/pause, frame nav, loop mode, compact inline mode.
- `frontend/src/ascii/AsciiGifCreator/` — was: did not exist. Now: `AsciiGifCreator` with multi-frame textarea editor, frame delay slider, live preview, image-to-ASCII upload, save to DB.
- `frontend/src/hooks/useInterval.ts` — was: did not exist. Now: `useInterval(callback, delay)` hook using `useRef` to avoid stale closures.
- `frontend/src/services/asciiGifs.ts` — was: did not exist. Now: `getAsciiGifs`, `saveAsciiGif`, `convertImageToAscii` service functions.
- `frontend/src/chat/components/ChatWindow/ChatWindow.tsx` — was: text-only message rendering. Now: renders `AsciiGifPlayer` inline for `ascii_gif` messages; added reaction chips, emoji picker, search bar, load-more on scroll, scroll position preservation.
- `frontend/src/chat/components/MessageInput/MessageInput.tsx` — was: text input + send button. Now: added GIF button that opens `AsciiGifCreator` modal overlay.
- `frontend/src/chat/useChat.ts` (`ChatMessage` type) — was: `{ id, sender, text, realm, timestamp, status }`. Now: added `type`, `asciiGif`, `reactions`, `conversationId` fields.

---

### Phase 3 → Phase 4 (v0.5.0 → v0.6.0): Messaging Polish

**What changed:**

- `backend/routes/reactions.js` — was: did not exist. Now: `POST /api/messages/:messageId/reactions` (toggle) and `GET /api/messages/:messageId/reactions` with per-user reaction tracking.
- `backend/index.js` (`toggle_reaction` socket event) — was: did not exist. Now: real-time reaction toggle via socket, broadcasts `reaction_updated` to conversation room.
- `backend/routes/conversations.js` (GET messages) — was: no search, no reactions. Now: `?q=` full-text search (case-insensitive), cursor-based pagination via `?before=<messageId>`, reactions aggregated per message.
- `frontend/src/chat/useChat.ts` — was: no reactions, no unread counts. Now: `toggleReaction`, `unreadCounts` state, `reaction_updated` socket handler that patches message reactions in-place.
- `frontend/src/chat/components/ChatWindow/ChatWindow.tsx` — was: no reactions, no search, no pagination. Now: emoji picker on hover, reaction chips with counts, search bar in header, scroll-to-top triggers `onLoadMore`, scroll position preserved after loading older messages.
- `frontend/src/chat/components/Sidebar/Sidebar.tsx` — was: no unread indicators. Now: `unread-badge` shown on DM/group items with count.
- `frontend/src/chat/ChatPage.tsx` — was: basic realm-only chat. Now: full Phase 4 wiring — `handleReact` (optimistic + socket), `handleLoadMore` (cursor pagination), debounced search, `useSoundEffects` for message/ritual sounds, unread count merge from socket state.
- `frontend/src/hooks/useSoundEffects.ts` — was: did not exist. Now: Web Audio API synth (no external files) with `message`, `ritual`, `notification` sound types.

---

### Phase 4 → Phase 5 (v0.6.0 → v0.7.0): Additional Rituals + Real MCP

**What changed:**

- `backend/routes/omens.js` — was: full mock implementation using random data with hardcoded weather conditions. Now: real weather via Open-Meteo API (free, no key) + Nominatim geocoding for city → lat/lon. Falls back to mock if the real API is unreachable. `source` field in response changed from `'weather-omen-mcp'` to `'open-meteo'` (or `'mock-fallback'`).
- `backend/routes/rituals.js` — was: did not exist. Now: three new endpoints — `GET /api/rituals/tarot` (3-card past/present/future spread from 22 Major Arcana), `GET /api/rituals/crystal-ball` (vision with optional `?focus=` query), `GET /api/rituals/runes` (1/3/5 rune cast from 24 Elder Futhark runes with reversed support).
- `backend/index.js` — was: no `/api/rituals` route. Now: `app.use('/api/rituals', require('./routes/rituals'))` registered.
- `frontend/src/services/rituals.ts` — was: did not exist. Now: `getTarotReading`, `getCrystalBallVision(focus?)`, `castRunes(count)` service functions with full TypeScript types.
- `frontend/src/rituals/TarotCard/` — was: did not exist. Now: `TarotCard` component — draws 3-card spread, shows card name/number/position/reversed state/meaning, severity badge, `onShare` prop sends formatted reading to chat.
- `frontend/src/rituals/CrystalBall/` — was: did not exist. Now: `CrystalBall` component — animated orb that pulses during gazing, optional focus input, clarity badge (murky/hazy/clear/crystalline), severity-colored orb glow, `onShare` prop.
- `frontend/src/rituals/RuneCasting/` — was: did not exist. Now: `RuneCasting` component — 1/3/5 rune selector, Elder Futhark symbols rendered large, reversed rune support, scatter animation during cast, `onShare` prop.
- `frontend/src/rituals/FortuneCard/FortuneCard.tsx` — was: no share capability. Now: `onShare` prop added; "SHARE TO CHAT" button appears after a fortune is revealed.
- `frontend/src/chat/ChatPage.tsx` — was: `RitualPanel` type was `'fortune' | 'wheel' | 'weather' | null`. Now: extended to `'fortune' | 'wheel' | 'weather' | 'tarot' | 'crystal' | 'runes' | null`. Added `handleShareRitualResult` callback that sends ritual text as a chat message and closes the panel. All new ritual components receive `onShare={handleShareRitualResult}`.
- `frontend/src/chat/components/Sidebar/Sidebar.tsx` — was: 3 ritual nav items. Now: 6 ritual nav items (added Tarot Reading 🃏, Crystal Ball 🔮, Rune Casting ᚱ). `RitualPanel` type updated to match.

---

## Phase 5 (Remaining): Astrology MCP Server

- Astrology MCP server (birth chart / daily horoscope)

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

*Last updated: Phase 4 complete — Messaging Polish*
