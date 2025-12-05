const express = require('express');
const router = express.Router();
const { validateMessage } = require('../utils/validation');
const { messages, addMessage, getMessagesByRealm } = require('../data/store');

// GET /api/messages - Fetch messages filtered by realm
router.get('/', (req, res) => {
  try {
    const { realm } = req.query;

    if (!realm) {
      return res.status(400).json({ 
        error: 'Realm parameter is required',
        example: '/api/messages?realm=living'
      });
    }

    const filteredMessages = getMessagesByRealm(realm);
    
    res.json({
      realm,
      count: filteredMessages.length,
      messages: filteredMessages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/messages - Add a new message
router.post('/', (req, res) => {
  try {
    const { sender, text, realm } = req.body;

    // Validate message fields
    const validation = validateMessage({ sender, text, realm });
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validation.errors 
      });
    }

    // Create new message
    const newMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      sender: sender.trim(),
      text: text.trim(),
      realm: realm.toLowerCase(),
      timestamp: new Date().toISOString()
    };

    addMessage(newMessage);

    res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/messages/all - Get all messages (for debugging)
router.get('/all', (req, res) => {
  res.json({
    count: messages.length,
    messages
  });
});

module.exports = router;
