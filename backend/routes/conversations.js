const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// All conversation routes require auth
router.use(requireAuth);

// GET /api/conversations — list user's conversations (realms + DMs + groups)
router.get('/', async (req, res) => {
  try {
    const memberships = await prisma.conversationMember.findMany({
      where: { userId: req.user.id },
      include: {
        conversation: {
          include: {
            members: { include: { user: { select: { id: true, username: true } } } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });

    const conversations = memberships.map(m => {
      const conv = m.conversation;
      const lastMessage = conv.messages[0] || null;
      // For DMs, derive the name from the other participant
      let displayName = conv.name;
      if (conv.type === 'dm') {
        const other = conv.members.find(mem => mem.userId !== req.user.id);
        displayName = other?.user.username ?? 'Unknown';
      }
      return {
        id: conv.id,
        type: conv.type,
        name: displayName,
        realmId: conv.realmId,
        members: conv.members.map(mem => ({ id: mem.userId, username: mem.user.username })),
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt
        } : null
      };
    });

    res.json({ conversations });
  } catch (err) {
    console.error('List conversations error:', err);
    res.status(500).json({ error: 'Failed to retrieve conversations' });
  }
});

// POST /api/conversations — create DM or group
router.post('/', async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;

    if (!['dm', 'group'].includes(type)) {
      return res.status(400).json({ error: 'type must be "dm" or "group"' });
    }
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: 'memberIds array required' });
    }
    if (type === 'group' && (!name || name.trim().length === 0)) {
      return res.status(400).json({ error: 'name required for group conversations' });
    }
    if (type === 'dm' && memberIds.length !== 1) {
      return res.status(400).json({ error: 'DM requires exactly one other member' });
    }

    // For DMs, check if one already exists between these two users
    if (type === 'dm') {
      const otherId = memberIds[0];
      const existing = await prisma.conversation.findFirst({
        where: {
          type: 'dm',
          AND: [
            { members: { some: { userId: req.user.id } } },
            { members: { some: { userId: otherId } } }
          ]
        }
      });
      if (existing) return res.json({ conversation: existing, existing: true });
    }

    // Verify all member IDs exist
    const allMemberIds = [req.user.id, ...memberIds.filter(id => id !== req.user.id)];
    const users = await prisma.user.findMany({
      where: { id: { in: allMemberIds } },
      select: { id: true, username: true }
    });
    if (users.length !== allMemberIds.length) {
      return res.status(404).json({ error: 'One or more users not found' });
    }

    const conversation = await prisma.conversation.create({
      data: {
        type,
        name: type === 'group' ? name.trim() : null,
        members: {
          create: allMemberIds.map(userId => ({ userId }))
        }
      },
      include: {
        members: { include: { user: { select: { id: true, username: true } } } }
      }
    });

    res.status(201).json({ conversation });
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// GET /api/conversations/:id/messages — paginated history
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before; // cursor: message id

    // Verify membership
    const member = await prisma.conversationMember.findUnique({
      where: { userId_conversationId: { userId: req.user.id, conversationId: id } }
    });
    if (!member) return res.status(403).json({ error: 'Not a member of this conversation' });

    const where = { conversationId: id };
    if (before) where.id = { lt: before };

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { sender: { select: { id: true, username: true } } }
    });

    res.json({
      messages: messages.reverse().map(m => ({
        id: m.id,
        sender: m.sender.username,
        senderId: m.senderId,
        content: m.content,
        type: m.type,
        createdAt: m.createdAt
      })),
      hasMore: messages.length === limit
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

// POST /api/conversations/:id/members — add member to group
router.post('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId required' });

    const conv = await prisma.conversation.findUnique({ where: { id } });
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    if (conv.type !== 'group') return res.status(400).json({ error: 'Can only add members to group conversations' });

    // Verify requester is a member
    const requesterMember = await prisma.conversationMember.findUnique({
      where: { userId_conversationId: { userId: req.user.id, conversationId: id } }
    });
    if (!requesterMember) return res.status(403).json({ error: 'Not a member of this conversation' });

    const member = await prisma.conversationMember.upsert({
      where: { userId_conversationId: { userId, conversationId: id } },
      update: {},
      create: { userId, conversationId: id }
    });

    res.status(201).json({ member });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

module.exports = router;
