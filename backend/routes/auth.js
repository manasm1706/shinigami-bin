const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function validateRegisterInput({ username, email, password }) {
  const errors = [];
  if (!username || username.trim().length < 2) errors.push('Username must be at least 2 characters');
  if (username && username.trim().length > 20) errors.push('Username must be 20 characters or less');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email required');
  if (!password || password.length < 6) errors.push('Password must be at least 6 characters');
  return errors;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const errors = validateRegisterInput({ username, email, password });
    if (errors.length) return res.status(400).json({ error: errors[0] });

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username: username.trim() }, { email: email.toLowerCase() }] }
    });
    if (existing) {
      const field = existing.username === username.trim() ? 'Username' : 'Email';
      return res.status(409).json({ error: `${field} already claimed by another soul` });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.toLowerCase(),
        passwordHash
      }
    });

    const token = signToken(user);
    console.log(`👻 New soul registered: ${user.username}`);

    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'The ritual of registration has failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: 'The spirits do not recognize these credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'The spirits do not recognize these credentials' });

    const token = signToken(user);
    console.log(`🌟 Soul authenticated: ${user.username}`);

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'The authentication ritual has failed' });
  }
});

// GET /api/auth/me — verify token and return current user
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const jwt_module = require('jsonwebtoken');
    const payload = jwt_module.verify(authHeader.slice(7), process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, email: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ error: 'Soul not found' });
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
