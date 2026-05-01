# Shinigami-bin Development Plan

## Current State (v0.7.0)

Full-featured real-time chat with persistent storage, real auth, multi-conversation messaging,
ASCII GIF system, messaging polish, and 6 rituals (Fortune, Wheel, Weather, Tarot, Crystal Ball, Runes).

---

## Changelog (Phases 0.5 → 5)

### Phase 0.5 → Phase 1 (v0.2.0 → v0.3.0): Persistent Storage + Real Auth
- `backend/data/messageStore.js` — was: sole message store (in-memory). Now: fallback only; Prisma DB is primary for authenticated users.
- `backend/data/prophecies.js` — was: in-memory array. Now: replaced by Prisma `Prophecy` model.
- `backend/lib/prisma.js` — was: did not exist. Now: Prisma client singleton using Neon adapter.
- `backend/prisma/schema.prisma` — was: did not exist. Now: `User`, `Conversation`, `ConversationMember`, `Message`, `Prophecy` models.
- `backend/routes/auth.js` — was: did not exist. Now: register/login/me with bcrypt + JWT.
- `backend/middleware/auth.js` — was: did not exist. Now: `requireAuth` JWT middleware.
- `backend/index.js` (Socket.IO) — was: no auth on sockets. Now: JWT handshake middleware.
- `frontend/src/auth/useAuth.tsx` — was: guest-only. Now: JWT + full User object.
- `frontend/src/auth/Login/Login.tsx` — was: username only. Now: register/login toggle with email + password.
- `frontend/src/services/api.ts` — was: did not exist. Now: `apiFetch` with auto `Authorization` header.

### Phase 1 → Phase 2 (v0.3.0 → v0.4.0): Multi-Conversation Messaging
- `backend/routes/conversations.js` — was: did not exist. Now: full CRUD for conversations.
- `backend/index.js` — was: realm-only socket events. Now: `join_conversation`, `send_conversation_message`, `typing_start/stop`, `online_users`.
- `frontend/src/chat/ChatPage.tsx` — was: empty (0 bytes). Now: full page wiring realms, DMs, groups, rituals, effects.
- `frontend/src/chat/useChat.ts` — was: realm-only. Now: conversation mode, `sendAsciiGif`, `toggleReaction`, `unreadCounts`.
- `frontend/src/chat/components/Sidebar/Sidebar.tsx` — was: static realm list. Now: Realms + Groups + DMs with unread badges.

### Phase 2 → Phase 3 (v0.4.0 → v0.5.0): ASCII GIF System
- `backend/prisma/schema.prisma` — was: no `AsciiGif`/`MessageReaction`. Now: both added; `Message` got `asciiGifId` FK.
- `backend/routes/asciiGifs.js` — was: did not exist. Now: CRUD + `POST /convert` (image-to-ASCII via `sharp`).
- `frontend/src/ascii/` — was: did not exist. Now: `AsciiGifPlayer` + `AsciiGifCreator` components.
- `frontend/src/hooks/useInterval.ts` — was: did not exist. Now: `useInterval` hook.
- `frontend/src/chat/components/ChatWindow/ChatWindow.tsx` — was: text-only. Now: inline `AsciiGifPlayer`, reactions, search, load-more.
- `frontend/src/chat/components/MessageInput/MessageInput.tsx` — was: text + send. Now: GIF button opens creator modal.

### Phase 3 → Phase 4 (v0.5.0 → v0.6.0): Messaging Polish
- `backend/routes/reactions.js` — was: did not exist. Now: toggle + get reactions.
- `backend/index.js` (`toggle_reaction`) — was: did not exist. Now: real-time reaction broadcast.
- `backend/routes/conversations.js` — was: no search/reactions. Now: `?q=` search, cursor pagination, reactions aggregated.
- `frontend/src/hooks/useSoundEffects.ts` — was: did not exist. Now: Web Audio API synth (message/ritual/notification).
- `frontend/src/chat/ChatPage.tsx` — was: basic. Now: reactions, pagination, search, sounds, unread merge.

### Phase 4 → Phase 5 (v0.6.0 → v0.7.0): Additional Rituals + Real MCP
- `backend/routes/omens.js` — was: full mock. Now: real Open-Meteo API + Nominatim geocoding, mock fallback.
- `backend/routes/rituals.js` — was: did not exist. Now: `/tarot`, `/crystal-ball`, `/runes` endpoints.
- `frontend/src/rituals/TarotCard/` — was: did not exist. Now: 3-card spread with reversed support.
- `frontend/src/rituals/CrystalBall/` — was: did not exist. Now: animated orb, focus input, clarity levels.
- `frontend/src/rituals/RuneCasting/` — was: did not exist. Now: Elder Futhark runes, 1/3/5 count, reversed.
- All ritual cards — was: no share. Now: `onShare` prop sends result as chat message.
- `frontend/src/chat/components/Sidebar/Sidebar.tsx` — was: 3 rituals. Now: 6 rituals.

---

## Phase 6: UX Fixes + EKG/ECG Visual Effect (v0.8.0)

### Phase 6.1 — Fix Clickability & Controls Panel
**Problem:** The `layout::before/after` pseudo-elements use `z-index: 999` and block mouse events on the header. The "Object1" (GlitchText username) has no pointer-events passthrough. The EFFECTS button is hard to discover.

**Changes:**
- `Layout.css` — fix `::before`/`::after` to use `pointer-events: none` explicitly; lower z-index below interactive elements.
- `Layout.tsx` — rename EFFECTS button label to "CONTROLS"; add keyboard hint tooltip "Tab = next · Shift+Tab = prev · Enter = select" visible on hover.
- `EffectSettingsPanel.tsx` — rename toggle label from "EFFECTS" to "CONTROLS"; ensure `cursor: pointer` and `z-index` are correct.
- `GlitchText.tsx` — ensure the wrapper `span` passes pointer events through to children.
- `index.css` — add global `* { pointer-events: auto }` guard for interactive elements.

### Phase 6.2 — EKG/ECG Full-Screen Effect
**New component:** `EKGOverlay` — a full-screen canvas overlay that renders:
- Scrolling neon green EKG waveform (sine + spike pattern)
- Grid background (faint green lines)
- Numerical vital signs HUD: heart rate (randomized 60–100 BPM), SpO2 (95–100%)
- Scanning horizontal line sweeping top-to-bottom
- Random screen glitch at intervals between 1 second and 5 minutes (random uniform distribution)
- Screen shake on glitch
- CRT "monitor damage" flicker on glitch

**Files:**
- `frontend/src/effects/EKGOverlay/EKGOverlay.tsx` — canvas-based EKG renderer
- `frontend/src/effects/EKGOverlay/EKGOverlay.css` — positioning + HUD styles
- `frontend/src/effects/index.ts` — export `EKGOverlay`
- `Layout.tsx` — mount `EKGOverlay` globally (always on, behind content)

### Phase 6.3 — Realm Redesign: Communities (Discord-style)
**Concept:** Realms become purpose-driven spaces:
- **Beyond** → Community hub: browse/join/create communities (like Discord servers), chat within them
- **Unknown** → Global chat: talk to anyone currently connected to the server
- **Living** → Personal: DMs and friend-list style private conversations

**Backend changes:**
- `backend/prisma/schema.prisma` — add `Community` model (name, description, icon, ownerId, isPublic)
- `backend/prisma/schema.prisma` — add `CommunityMember` model
- `backend/routes/communities.js` — `GET /api/communities`, `POST /api/communities`, `POST /api/communities/:id/join`, `GET /api/communities/:id/channels`
- `backend/index.js` — `join_community` socket event, community-scoped rooms

**Frontend changes:**
- `frontend/src/types/index.ts` — add `Community` type
- `frontend/src/services/communities.ts` — API service
- `frontend/src/chat/components/CommunityBrowser/` — browse/join/create communities (shown when Beyond realm is active)
- `frontend/src/chat/components/GlobalChat/` — shown when Unknown realm is active
- `frontend/src/chat/ChatPage.tsx` — route realm selection to correct view component
- `frontend/src/chat/components/Sidebar/Sidebar.tsx` — show community channels under Beyond, global users under Unknown, DMs under Living

---

## Phase 6 Implementation Order

### Phase 6 — Part 1 (this session): UX Fixes + EKG Effect
1. Fix pointer-events / z-index blocking clicks ✓
2. Rename EFFECTS → CONTROLS, add keyboard hint ✓
3. Build EKGOverlay with random glitch intervals ✓
4. Mount EKGOverlay in Layout ✓

### Phase 6 — Part 2 (next session): Realm Redesign
1. Add Community schema + migration
2. Build communities backend routes
3. Build CommunityBrowser frontend component
4. Rewire ChatPage realm views
5. Update Sidebar for new realm semantics

---

## Phase 7: Polish + Production (v0.9.0)

- PWA manifest + service worker
- Mobile responsive layout
- Dark/light theme toggle (keep terminal aesthetic)
- Rate limiting UI feedback
- Error boundary components
- Loading skeletons
- Accessibility audit (ARIA labels, focus management)

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

## Phase 7: ASCII GIF v2 — Video Support + Monochrome Green (v0.8.1)

### Problems Fixed
- `express.json()` default 100kb limit rejects large base64 payloads → increase to 50mb
- Token stored correctly but large request body causes 413 which frontend misreads as auth error
- `/api/ascii-gifs/convert` needs multipart for video → use `multer` for video, keep JSON for images

### New Features
- **Video-to-ASCII**: Upload mp4/webm/gif, extract frames via `fluent-ffmpeg`, convert each to ASCII
- **Video cropping**: Start/end time sliders (max 10 seconds total)
- **Monochrome green palette**: ASCII chars colored in terminal green shades (`#001a00` → `#00ff41`) by brightness
- **Always loop**: `AsciiGifPlayer` always loops in inline/compact mode
- **Max 10 seconds**: Backend enforces `frameCount * frameDelay ≤ 10000ms`

### Backend Changes
- `backend/index.js` — `express.json({ limit: '50mb' })`
- `backend/routes/asciiGifs.js` — `POST /api/ascii-gifs/convert-video` with `multer` + `fluent-ffmpeg` + `sharp`
- `backend/package.json` — add `fluent-ffmpeg`, `multer`, `@ffmpeg-installer/ffmpeg`

### Frontend Changes
- `AsciiGifCreator.tsx` — video upload tab with crop sliders, progress bar
- `AsciiGifPlayer.tsx` — always loop, monochrome green CSS
- `AsciiGifPlayer.css` — green gradient char coloring
- `asciiGifs.ts` — `convertVideoToAscii()` using `FormData`

---

*Last updated: Phase 7 — ASCII GIF v2 + Video Support*
