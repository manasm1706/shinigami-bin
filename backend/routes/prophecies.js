const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { generateOminousProphecy } = require('../data/prophecies');
const { optionalAuth } = require('../middleware/auth');

function validateProphecy({ title, date }) {
  const errors = [];
  if (!title || typeof title !== 'string' || title.trim().length === 0) errors.push('Title is required');
  if (title && title.trim().length > 200) errors.push('Title must be 200 characters or less');
  if (!date || isNaN(new Date(date).getTime())) errors.push('Valid date required');
  return errors;
}

// POST /api/prophecies
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { title, date } = req.body;
    const errors = validateProphecy({ title, date });
    if (errors.length) return res.status(400).json({ error: errors[0] });

    const ominousData = generateOminousProphecy(title, date);

    // If authenticated, store in DB; otherwise return ephemeral prophecy
    if (req.user) {
      const prophecy = await prisma.prophecy.create({
        data: {
          userId: req.user.id,
          title: title.trim(),
          date: new Date(date),
          ominousTitle: ominousData.ominousTitle,
          ominousDescription: ominousData.ominousDescription,
          severity: ominousData.severity
        }
      });
      return res.status(201).json({
        success: true,
        prophecy,
        message: 'The prophecy has been inscribed in the cosmic ledger'
      });
    }

    // Guest fallback — ephemeral, not persisted
    const prophecy = {
      id: Date.now().toString(),
      title: title.trim(),
      date: new Date(date).toISOString(),
      ...ominousData,
      createdAt: new Date().toISOString()
    };
    res.status(201).json({ success: true, prophecy, message: 'The prophecy has been inscribed in the cosmic ledger' });
  } catch (err) {
    console.error('Prophecy create error:', err);
    res.status(500).json({ error: 'Failed to inscribe prophecy' });
  }
});

// GET /api/prophecies
router.get('/', optionalAuth, async (req, res) => {
  try {
    if (req.user) {
      const prophecies = await prisma.prophecy.findMany({
        where: { userId: req.user.id },
        orderBy: { date: 'asc' }
      });
      return res.json({ count: prophecies.length, prophecies });
    }
    // Guest — return empty
    res.json({ count: 0, prophecies: [], message: 'Sign in to persist your prophecies across the void' });
  } catch (err) {
    console.error('Prophecy fetch error:', err);
    res.status(500).json({ error: 'Failed to consult the cosmic calendar' });
  }
});

// DELETE /api/prophecies/:id
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    const prophecy = await prisma.prophecy.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!prophecy) return res.status(404).json({ error: 'Prophecy not found in the cosmic ledger' });

    await prisma.prophecy.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'The prophecy has been erased from the timeline' });
  } catch (err) {
    console.error('Prophecy delete error:', err);
    res.status(500).json({ error: 'Failed to alter the cosmic ledger' });
  }
});

module.exports = router;
