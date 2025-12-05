# Shinigami-bin Backend API

Backend server for the Shinigami-bin messaging platform.

## Setup

```bash
npm install
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Get Messages by Realm
```
GET /api/messages?realm=living
```

Query Parameters:
- `realm` (required): Filter messages by realm (living, beyond, unknown)

Response:
```json
{
  "realm": "living",
  "count": 5,
  "messages": [
    {
      "id": "1234567890",
      "sender": "User",
      "text": "Hello from the living realm",
      "realm": "living",
      "timestamp": "2025-12-05T10:30:00.000Z"
    }
  ]
}
```

### Post New Message
```
POST /api/messages
Content-Type: application/json

{
  "sender": "User",
  "text": "Your message here",
  "realm": "living"
}
```

Response:
```json
{
  "success": true,
  "message": {
    "id": "1234567890abc",
    "sender": "User",
    "text": "Your message here",
    "realm": "living",
    "timestamp": "2025-12-05T10:30:00.000Z"
  }
}
```

### Get All Messages (Debug)
```
GET /api/messages/all
```

## Validation Rules

- **sender**: Required, string, 1-50 characters
- **text**: Required, string, 1-1000 characters
- **realm**: Required, must be one of: living, beyond, unknown

## Project Structure

```
backend/
├── index.js              # Main server file
├── routes/
│   └── messages.js       # Message routes
├── data/
│   └── store.js          # In-memory data store
├── utils/
│   └── validation.js     # Validation utilities
└── package.json
```
