const express = require('express');
const router = express.Router({ mergeParams: true });
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

const ALLOWED_EMOJI = ['👍','👎','❤️','😂','😮','😢','🔥','💀','👻','⚡'];

// POST /api/messages/:messageId/reactions — toggle reaction
router.post('/', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji || !ALLOWED_EMOJI.includes(emoji)) {
      return res.status(400).json({ error: 'Invalid emoji', allowed: ALLOWED_EMOJI });
    }

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Verify user is a member of the conversation
    const member = await prisma.conversationMember.findUnique({
      where: { userId_conversationId: { userId: req.user.id, conversationId: message.conversationId } }
    });
    if (!member) return res.status(403).json({ error: 'Not a member of this conversation' });

    // Toggle: if exists remove, else add
    const existing = await prisma.messageReaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId: req.user.id, emoji } }
    });

    if (existing) {
      await prisma.messageReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.messageReaction.create({ data: { messageId, userId: req.user.id, emoji } });
    }

    // Return updated reaction counts for this message
    const reactions = await prisma.messageReaction.groupBy({
      by: ['emoji'],
      where: { messageId },
      _count: { emoji: true }
    });

    res.json({
      messageId,
      reactions: reactions.map(r => ({ emoji: r.emoji, count: r._count.emoji })),
      toggled: existing ? 'removed' : 'added',
      emoji
    });
  } catch (err) {
    console.error('Reaction error:', err);
    res.status(500).json({ error: 'Failed to toggle reaction' });
  }
});

// GET /api/messages/:messageId/reactions
router.get('/', async (req, res) => {
  try {
    const { messageId } = req.params;
    const reactions = await prisma.messageReaction.groupBy({
      by: ['emoji'],
      where: { messageId },
      _count: { emoji: true }
    });
    // Also get which emojis the current user has reacted with
    const userReactions = await prisma.messageReaction.findMany({
      where: { messageId, userId: req.user.id },
      select: { emoji: true }
    });
    res.json({
      messageId,
      reactions: reactions.map(r => ({ emoji: r.emoji, count: r._count.emoji })),
      userReactions: userReactions.map(r => r.emoji)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get reactions' });
  }
});

module.exports = router;
