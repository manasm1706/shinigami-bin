const express = require('express');
const router = express.Router();
const { generateDailyFortune } = require('../utils/fortunes');
const { validateUsername, createValidationMiddleware } = require('../utils/inputValidation');

// Rate limiting storage for rituals
const ritualRateLimits = new Map();

/**
 * Check ritual rate limit (1 per 10 seconds per user)
 */
function checkRitualRateLimit(username) {
  const key = `ritual_${username}`;
  const now = Date.now();
  
  if (!ritualRateLimits.has(key)) {
    ritualRateLimits.set(key, now);
    return true;
  }
  
  const lastExecution = ritualRateLimits.get(key);
  if (now - lastExecution < 10000) { // 10 seconds
    return false;
  }
  
  ritualRateLimits.set(key, now);
  return true;
}

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of ritualRateLimits.entries()) {
    if (now - timestamp > 5 * 60 * 1000) { // 5 minutes
      ritualRateLimits.delete(key);
    }
  }
}, 5 * 60 * 1000);

// GET /api/fortune/daily - Get daily fortune for a user
router.get('/daily', 
  createValidationMiddleware({
    query: {
      username: validateUsername
    }
  }),
  (req, res) => {
    try {
      const { username } = req.query;

      // Check rate limit
      if (!checkRitualRateLimit(username)) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please wait before requesting another fortune.',
          retryAfter: 10
        });
      }

      const fortune = generateDailyFortune(username);
      
      res.json(fortune);
    } catch (error) {
      console.error('Fortune generation error:', error);
      res.status(500).json({ 
        error: 'The spirits are temporarily unavailable. Please try again later.' 
      });
    }
  }
);

module.exports = router;
