# Shinigami-bin Context & Design Decisions

## What This Project Is

Shinigami-bin is a supernatural-themed real-time messaging platform. It started as a Halloween demo and is evolving into a production-style social messaging platform — think Discord or WhatsApp but with a terminal aesthetic and mystical features.

The UI aesthetic (green-on-black, CRT scanlines, glitch text, ghost overlays) is intentional and permanent. It is not a prototype style to be replaced — it is the identity of the project.

---

## Current State

### What's Working
- Real-time realm-based chat (Socket.IO, 3 realms)
- Guest login via localStorage
- Ritual system: Fortune, Weather Omen (MCP bridge), Wheel of Fate
- Visual effects: GhostOverlay, CRT, GlitchText (event-driven, toggleable)
- Prophecies (POST/GET with ominous language generation)
- Feature-based frontend architecture
- React Router (/login, /chat)
- Input validation + rate limiting

### What's In-Memory (needs DB)
- Messages (per realm, 200 max)
- Prophecies
- User presence (per realm)

### What's Guest-Only (needs real auth)
- Login is just a username stored in localStorage
- No passwords, no accounts, no persistent identity

---

## Key Design Decisions

### 1. Supernatural Aesthetic is Non-Negotiable
The terminal style, ominous language, and visual effects are core to the project. No decision should compromise this. When adding features, ask: "does this fit the supernatural terminal vibe?"

### 2. Ritual System = Modular Feature Framework
Rituals are pluggable modules registered in a central registry. Each exposes `execute()` and returns a structured result. This pattern must be preserved as new rituals are added. Effects are triggered by ritual completion events — not hardcoded inside ritual logic.

### 3. MCP Bridge Lives in the Backend
The frontend never calls MCP servers directly. The backend exposes a normal REST endpoint that internally calls the MCP server via stdio transport. This keeps the frontend clean and allows the MCP layer to evolve independently.

### 4. Socket.IO is Event-Driven, Not Polled
All real-time data (messages, presence, typing) flows through Socket.IO events. REST endpoints are for CRUD operations and initial data loads only. Never add polling for real-time data.

### 5. TypeScript Import Rules
`verbatimModuleSyntax` is enabled in the frontend. All interface/type imports must use `import type`. Failing to do this causes runtime errors (white screen).

```typescript
// Correct
import type { Realm } from '../types';

// Wrong — will break at runtime
import { Realm } from '../types';
```

### 6. Auth Evolution Path
Current: guest username → localStorage
Next: real signup/login → JWT → localStorage (token)
The AuthContext interface will expand but the hook API (`useAuth()`) stays the same.

### 7. Conversation Model
Moving from realm-only to three conversation types:
- `realm` — open channels (Living, Beyond, Unknown), auto-created
- `dm` — private 1:1 between two users
- `group` — user-created named room with membership

Socket.IO rooms will be mapped to `conversation_${id}` instead of `realm_${name}`.

### 8. ASCII GIF System
A creative feature unique to this platform. Three parts:
1. **Player** — renders frame arrays in a loop (`<pre>` tag, useInterval)
2. **Creator** — multi-frame editor with preview
3. **Video converter** — backend pipeline: extract frames → resize → brightness → ASCII chars

ASCII GIFs are a message type (`type: "ascii_gif"`) and render inline in chat.

### 9. Fortune Tone
Fortunes, omens, and prophecies must be:
- Mysterious and cryptic
- Subtly humorous or sarcastic
- Never generic ("You will have a great day!")
- Never mention AI, algorithms, or technology
- Written as if from an ancient supernatural entity

### 10. Effect System Stays Decoupled
Visual effects are triggered by events, not by direct calls from business logic. This means:
- Rituals emit completion events
- EffectSystem listens and triggers the appropriate effect
- UI components listen to EffectSystem
- No ritual code should import or call effect components directly

---

## What Not To Do

- Do not redesign the UI or remove the supernatural theme
- Do not convert this into a generic chat app
- Do not add polling for real-time data
- Do not call MCP servers from the frontend
- Do not use value imports for TypeScript interfaces
- Do not hardcode effect calls inside ritual logic

---

## Ports
- Backend: http://localhost:3001
- Frontend: http://localhost:5173
- VITE_API_BASE_URL=http://localhost:3001/api

---

*Last updated: Production planning phase*
