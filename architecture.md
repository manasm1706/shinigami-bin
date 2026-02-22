# Shinigami-bin Architecture

## System Overview

Shinigami-bin is built as a modern web application with a clear separation between frontend, backend, and external services. The architecture emphasizes real-time communication, modular design, and extensibility.

## Frontend Architecture

### Technology Stack
- **React 19** - UI framework with hooks and functional components
- **TypeScript** - Type safety and developer experience
- **Vite** - Fast build tool and development server
- **Socket.IO Client** - Real-time communication
- **React Router** - Client-side routing

### Directory Structure
```
frontend/src/
├── app/                    # Application shell
│   ├── App.tsx            # Root component (legacy)
│   ├── Router.tsx         # Route configuration
│   └── Layout/            # Main layout wrapper
├── auth/                  # Authentication system
│   ├── Login/             # Login component
│   └── useAuth.tsx        # Auth hook and context
├── chat/                  # Real-time messaging
│   ├── ChatPage.tsx       # Main chat interface
│   ├── useChat.ts         # Socket.IO integration
│   └── components/        # Chat UI components
├── rituals/               # Fortune telling system
│   ├── RitualRegistry.ts  # Central ritual management
│   ├── useRituals.ts      # Ritual execution hook
│   ├── rituals/           # Individual ritual implementations
│   └── components/        # Ritual UI components
├── effects/               # Visual effects system
│   ├── EffectSystem.ts    # Event-based effect engine
│   ├── GhostOverlay/      # Ethereal visual effects
│   ├── CRTOverlay/        # Retro terminal effects
│   └── GlitchText/        # Text corruption effects
├── services/              # API communication
│   ├── api.ts             # Base API configuration
│   ├── messages.ts        # Chat API calls
│   ├── fortune.ts         # Fortune API calls
│   └── weatherOmen.ts     # Weather omen API calls
└── types/                 # TypeScript definitions
```

### Component Architecture

#### Atomic Design Principles
- **Atoms**: Basic UI elements (buttons, inputs, text)
- **Molecules**: Simple component combinations (message item, ritual card)
- **Organisms**: Complex UI sections (chat window, ritual executor)
- **Templates**: Page layouts (main layout, chat layout)
- **Pages**: Route components (chat page, login page)

#### State Management
- **Local State**: React useState for component-specific data
- **Context API**: Auth state, effect settings
- **Custom Hooks**: Business logic abstraction (useChat, useRituals, useEffects)
- **No Redux**: Kept simple with React's built-in state management

### Real-time Communication

#### Socket.IO Integration
```typescript
// useChat hook manages Socket.IO connection
const { messages, users, isConnected, joinRealm, sendMessage } = useChat();

// Event handling
socket.on('receive_message', handleReceiveMessage);
socket.on('realm_history', handleRealmHistory);
socket.on('user_joined', handleUserJoined);
```

#### Message Flow
1. User types message → `sendMessage()` called
2. Hook emits `send_message` event to server
3. Server broadcasts to all realm users
4. All clients receive `receive_message` event
5. Messages state updated → UI re-renders

## Backend Architecture

### Technology Stack
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Socket.IO** - Real-time communication
- **CORS** - Cross-origin resource sharing

### Directory Structure
```
backend/
├── index.js               # Main server file
├── routes/                # REST API endpoints
│   ├── messages.js        # Chat API (legacy)
│   ├── fortune.js         # Fortune telling API
│   ├── omens.js          # Weather omen API (MCP bridge)
│   └── prophecies.js     # Prophecy API
├── data/                  # Data layer
│   ├── messageStore.js    # In-memory message storage
│   ├── store.js          # General data store
│   └── prophecies.js     # Prophecy data
└── utils/                 # Utility functions
    ├── fortunes.js       # Fortune generation
    └── validation.js     # Input validation
```

### API Design

#### REST Endpoints
```
GET  /api/health           # Health check
GET  /api/fortune/daily    # Daily fortune
GET  /api/omens/weather    # Weather omen (MCP bridge)
GET  /api/prophecies       # List prophecies
POST /api/prophecies       # Create prophecy
GET  /api/messages/stats   # Message statistics
```

#### Socket.IO Events
```
Client → Server:
- join_realm(realm, username)
- send_message(realm, sender, text)

Server → Client:
- receive_message(message)
- realm_history(realm, messages)
- user_joined(username, realm)
- user_left(username, realm)
- realm_users(realm, users)
```

### Data Storage

#### In-Memory Storage
```javascript
// Message storage per realm
const messageStore = {
  messages: Map<realm, Message[]>,
  maxMessagesPerRealm: 100,
  addMessage(message),
  getRecentMessages(realm, limit)
};

// User tracking per realm
const realmUsers = Map<realm, User[]>;
```

#### Database Migration Path
The current in-memory storage is designed for easy migration to persistent storage:

```javascript
// Current: In-memory
messageStore.addMessage(message);

// Future: Database
await db.messages.create(message);
```

## Effect System Architecture

### Event-Driven Design
The effect system uses an event-driven architecture to decouple visual effects from business logic:

```typescript
// Effect triggering (from ritual completion)
effectSystem.triggerEffect('ghost_dramatic', { ritualType: 'wheel_of_fate' });

// Effect listening (in UI components)
useEffect(() => {
  const cleanup = addListener('ghost_dramatic', handleGhostEffect);
  return cleanup;
}, []);
```

### Effect Types
- **Ghost Overlays**: Ethereal visual effects with particles and wisps
- **CRT Effects**: Scanlines, flicker, and screen curvature
- **Glitch Text**: Dynamic text corruption with color separation
- **Future**: Screen shake, particle bursts, sound effects

### Settings Management
```typescript
interface EffectSettings {
  crtOverlay: { enabled: boolean; intensity: 'low' | 'medium' | 'high' };
  glitchText: { enabled: boolean; intensity: 'low' | 'medium' | 'high'; trigger: 'hover' | 'continuous' | 'random' };
  ghostEffects: { enabled: boolean };
}
```

## Ritual System Architecture

### Registry Pattern
The ritual system uses a centralized registry for managing and executing rituals:

```typescript
class RitualRegistry {
  private rituals = Map<string, RitualDefinition>();
  
  register(ritual: RitualDefinition): void;
  execute(ritualId: string, params?: any): Promise<RitualResult>;
  isOnCooldown(ritualId: string): boolean;
}
```

### Ritual Lifecycle
1. **Registration**: Rituals register themselves with the registry
2. **Validation**: Parameters validated before execution
3. **Execution**: Ritual function called with parameters
4. **Cooldown**: Execution time recorded for cooldown management
5. **Effects**: Success triggers appropriate visual effects
6. **History**: Results stored for debugging and analytics

### Extensibility
Adding new rituals is straightforward:

```typescript
const newRitual: RitualDefinition = {
  id: 'tarot_reading',
  name: 'Tarot Reading',
  category: 'divination',
  cooldown: 120000, // 2 minutes
  async execute(params) {
    // Ritual implementation
    return { success: true, data: { cards: [...] } };
  }
};

ritualRegistry.register(newRitual);
```

## MCP Integration Architecture

### Bridge Pattern
The backend acts as a bridge between the frontend and MCP servers:

```
Frontend → Backend API → MCP Server → External APIs
         ←             ←            ←
```

### MCP Server Communication
```javascript
// Conceptual MCP integration (currently mocked)
const { Client } = require('@modelcontextprotocol/sdk/client');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio');

async function callMCPServer(toolName, params) {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['./.kiro/mcp/weather-omen/index.js']
  });
  
  const client = new Client({ name: 'shinigami-backend' });
  await client.connect(transport);
  
  const result = await client.request({
    method: 'tools/call',
    params: { name: toolName, arguments: params }
  });
  
  await client.close();
  return result;
}
```

### Error Handling
- **Graceful Degradation**: Fallback to mock data if MCP server unavailable
- **User Feedback**: Clear error messages for connection issues
- **Retry Logic**: Automatic retries with exponential backoff
- **Status Monitoring**: Health checks and connection status

## Security Considerations

### Current Security Measures
- **CORS Configuration**: Restricts cross-origin requests
- **Input Validation**: Basic parameter validation
- **Rate Limiting**: Ritual cooldowns prevent spam
- **No Sensitive Data**: Guest-only authentication model

### Future Security Enhancements
- **Authentication**: JWT tokens for user sessions
- **Authorization**: Role-based access control
- **Input Sanitization**: XSS and injection prevention
- **Rate Limiting**: API endpoint protection
- **HTTPS**: Encrypted communication
- **CSP Headers**: Content Security Policy

## Performance Considerations

### Current Optimizations
- **In-Memory Storage**: Fast message retrieval
- **Connection Pooling**: Socket.IO connection reuse
- **Event Debouncing**: Prevents excessive effect triggering
- **Lazy Loading**: Components loaded on demand

### Scalability Challenges
- **Memory Usage**: In-memory storage doesn't scale
- **Single Server**: No horizontal scaling
- **No Caching**: Repeated API calls
- **No CDN**: Static assets served from origin

### Future Performance Improvements
- **Database**: Persistent storage with indexing
- **Redis**: Caching and session storage
- **Load Balancing**: Multiple server instances
- **CDN**: Static asset distribution
- **Message Pagination**: Limit message loading
- **Virtual Scrolling**: Handle large message lists

## Deployment Architecture

### Current Deployment
- **Development**: Local servers (frontend + backend)
- **No Production**: Demo/development only

### Recommended Production Setup
```
Internet → Load Balancer → Web Servers → Database
                       → Socket.IO Servers → Redis
                       → MCP Servers
```

### Infrastructure Components
- **Web Servers**: Multiple Node.js instances
- **Database**: PostgreSQL with read replicas
- **Cache**: Redis for sessions and frequent data
- **Message Queue**: For background processing
- **Monitoring**: Application and infrastructure metrics
- **Logging**: Centralized log aggregation

## Testing Strategy

### Current Testing
- **Manual Testing**: Developer verification
- **No Automated Tests**: Technical debt

### Recommended Testing Pyramid
```
E2E Tests (Few)
├── Integration Tests (Some)
├── Unit Tests (Many)
└── Static Analysis (TypeScript, ESLint)
```

### Test Categories
- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints and Socket.IO events
- **E2E Tests**: Complete user workflows
- **Performance Tests**: Load testing and benchmarks
- **Security Tests**: Vulnerability scanning

## Monitoring and Observability

### Current Monitoring
- **Console Logs**: Basic debugging information
- **No Metrics**: No performance monitoring
- **No Alerting**: No automated notifications

### Recommended Observability Stack
- **Metrics**: Application and business metrics
- **Logging**: Structured logging with correlation IDs
- **Tracing**: Distributed request tracing
- **Alerting**: Automated incident detection
- **Dashboards**: Real-time system visibility

### Key Metrics to Track
- **User Metrics**: Active users, session duration
- **Message Metrics**: Messages per second, delivery latency
- **Ritual Metrics**: Execution success rate, response time
- **System Metrics**: CPU, memory, network usage
- **Error Metrics**: Error rates, failure patterns

## Conclusion

The Shinigami-bin architecture balances simplicity with extensibility. The modular design allows for easy feature additions while maintaining clear separation of concerns. The real-time communication layer provides immediate feedback, and the effect system creates an immersive user experience.

Key architectural strengths:
- **Modular Design**: Clear separation between chat, rituals, and effects
- **Real-time Communication**: Socket.IO for instant messaging
- **Extensible Ritual System**: Easy to add new fortune-telling features
- **Event-Driven Effects**: Decoupled visual feedback system
- **Type Safety**: TypeScript throughout the application

Areas for improvement:
- **Persistent Storage**: Replace in-memory storage
- **Authentication**: Move beyond guest-only model
- **Testing**: Add comprehensive test coverage
- **Performance**: Optimize for scale
- **Security**: Implement production-grade security measures