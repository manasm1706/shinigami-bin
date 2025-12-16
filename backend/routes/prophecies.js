const express = require('express');
const router = express.Router();
const { 
  addProphecy, 
  getAllProphecies, 
  getPropheciesByDateRange,
  deleteProphecy 
} = require('../data/prophecies');

/**
 * Validate prophecy data
 */
function validateProphecy({ title, date }) {
  const errors = [];

  // Validate title
  if (!title) {
    errors.push('Title is required');
  } else if (typeof title !== 'string') {
    errors.push('Title must be a string');
  } else if (title.trim().length === 0) {
    errors.push('Title cannot be empty');
  } else if (title.trim().length > 200) {
    errors.push('Title must be 200 characters or less');
  }

  // Validate date
  if (!date) {
    errors.push('Date is required');
  } else {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Date must be a valid ISO 8601 date string');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// POST /api/prophecies - Create a new prophecy
router.post('/', (req, res) => {
  try {
    const { title, date } = req.body;

    // Validate prophecy data
    const validation = validateProphecy({ title, date });
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validation.errors 
      });
    }

    // Create prophecy
    const newProphecy = addProphecy({ title, date });

    res.status(201).json({
      success: true,
      prophecy: newProphecy,
      message: 'The prophecy has been inscribed in the cosmic ledger'
    });

  } catch (error) {
    console.error('Error creating prophecy:', error);
    res.status(500).json({ 
      error: 'Failed to inscribe prophecy',
      details: error.message 
    });
  }
});

// GET /api/prophecies - Get all prophecies or filter by date range
router.get('/', (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let prophecies;
    
    if (startDate && endDate) {
      // Validate date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)'
        });
      }
      
      if (start > end) {
        return res.status(400).json({
          error: 'Start date must be before end date'
        });
      }
      
      prophecies = getPropheciesByDateRange(startDate, endDate);
    } else {
      prophecies = getAllProphecies();
    }

    res.json({
      count: prophecies.length,
      prophecies,
      message: prophecies.length > 0 
        ? 'The cosmic calendar reveals its secrets' 
        : 'The future remains unwritten... for now'
    });

  } catch (error) {
    console.error('Error fetching prophecies:', error);
    res.status(500).json({ 
      error: 'Failed to consult the cosmic calendar',
      details: error.message 
    });
  }
});

// DELETE /api/prophecies/:id - Delete a prophecy
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Prophecy ID is required'
      });
    }

    const deletedProphecy = deleteProphecy(id);

    if (!deletedProphecy) {
      return res.status(404).json({
        error: 'Prophecy not found in the cosmic ledger'
      });
    }

    res.json({
      success: true,
      prophecy: deletedProphecy,
      message: 'The prophecy has been erased from the timeline'
    });

  } catch (error) {
    console.error('Error deleting prophecy:', error);
    res.status(500).json({ 
      error: 'Failed to alter the cosmic ledger',
      details: error.message 
    });
  }
});

// GET /api/prophecies/upcoming - Get upcoming prophecies (next 7 days)
router.get('/upcoming', (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const upcomingProphecies = getPropheciesByDateRange(
      now.toISOString(), 
      nextWeek.toISOString()
    );

    res.json({
      count: upcomingProphecies.length,
      prophecies: upcomingProphecies,
      timeframe: 'next 7 days',
      message: upcomingProphecies.length > 0 
        ? 'The immediate future stirs with foretold events' 
        : 'The coming days hold no recorded prophecies... yet'
    });

  } catch (error) {
    console.error('Error fetching upcoming prophecies:', error);
    res.status(500).json({ 
      error: 'Failed to peer into the immediate future',
      details: error.message 
    });
  }
});

module.exports = router;