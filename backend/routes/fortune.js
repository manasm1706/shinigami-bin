const express = require('express');
const router = express.Router();
const { generateDailyFortune } = require('../utils/fortunes');

// GET /api/fortune/daily - Get daily fortune for a user
router.get('/daily', (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ 
        error: 'Username parameter is required',
        example: '/api/fortune/daily?username=YourName'
      });
    }

    if (typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Username must be a non-empty string'
      });
    }

    if (username.trim().length > 50) {
      return res.status(400).json({ 
        error: 'Username must be 50 characters or less'
      });
    }

    const fortune = generateDailyFortune(username.trim());
    
    res.json(fortune);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
