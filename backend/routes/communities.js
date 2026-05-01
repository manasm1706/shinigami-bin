const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/communities — list all public communities + ones user is in
router.get('/', async (req, res) => {
  try {
    const communities = await prisma.community.findMany({
      where: {
        OR: [
          { isPublic: true },
          { members: { some: { userId: req.user.id } } }
        ]
      },
      include: {
        owner: { select: { id: true, username: true } },
        _count: { select: { members: true, channels: true } },
        members: { where: { userId: req.user.id }, select: { role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      communities: communities.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        icon: c.icon,
        isPublic: c.isPublic,
        owner: c.owner,
        memberCount: c._count.members,
        channelCount: c._count.channels,
        isMember: c.members.length > 0,
        role: c.members[0]?.role ?? null,
      }))
    });
  } catch (err) {
    console.error('List communities error:', err);
    res.status(500).json({ error: 'Failed to retrieve communities' });
  }
});

// POST /api/communities — create a community
router.post('/', async (req, res) => {
  try {
    const { name, description = '', icon = '◆', isPublic = true } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'name must be at least 2 characters' });
    }

    const community = await prisma.community.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        icon: icon.trim() || '◆',
        isPublic: Boolean(isPublic),
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'owner' }
        },
        channels: {
          create: {
            name: 'general',
            description: 'General discussion',
            conversation: {
              create: {
                type: 'group',
                name: `${name.trim()} #general`,
                members: { create: { userId: req.user.id } }
              }
            }
          }
        }
      },
      include: {
        owner: { select: { id: true, username: true } },
        _count: { select: { members: true, channels: true } }
      }
    });

    res.status(201).json({
      community: {
        id: community.id,
        name: community.name,
        description: community.description,
        icon: community.icon,
        isPublic: community.isPublic,
        owner: community.owner,
        memberCount: community._count.members,
        channelCount: community._count.channels,
        isMember: true,
        role: 'owner',
      }
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A community with that name already exists' });
    }
    console.error('Create community error:', err);
    res.status(500).json({ error: 'Failed to create community' });
  }
});

// POST /api/communities/:id/join
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const community = await prisma.community.findUnique({ where: { id } });
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (!community.isPublic) return res.status(403).json({ error: 'This community is private' });

    const existing = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: id, userId: req.user.id } }
    });
    if (existing) return res.json({ message: 'Already a member', alreadyMember: true });

    await prisma.communityMember.create({
      data: { communityId: id, userId: req.user.id, role: 'member' }
    });

    // Also add user to all community channel conversations
    const channels = await prisma.communityChannel.findMany({
      where: { communityId: id },
      select: { conversationId: true }
    });
    for (const ch of channels) {
      if (ch.conversationId) {
        await prisma.conversationMember.upsert({
          where: { userId_conversationId: { userId: req.user.id, conversationId: ch.conversationId } },
          update: {},
          create: { userId: req.user.id, conversationId: ch.conversationId }
        });
      }
    }

    res.json({ message: 'Joined community' });
  } catch (err) {
    console.error('Join community error:', err);
    res.status(500).json({ error: 'Failed to join community' });
  }
});

// POST /api/communities/:id/leave
router.post('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: id, userId: req.user.id } }
    });
    if (!member) return res.status(404).json({ error: 'Not a member' });
    if (member.role === 'owner') return res.status(400).json({ error: 'Owner cannot leave. Transfer ownership first.' });

    await prisma.communityMember.delete({
      where: { communityId_userId: { communityId: id, userId: req.user.id } }
    });
    res.json({ message: 'Left community' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to leave community' });
  }
});

// GET /api/communities/:id/channels
router.get('/:id/channels', async (req, res) => {
  try {
    const { id } = req.params;
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: id, userId: req.user.id } }
    });
    if (!member) {
      const community = await prisma.community.findUnique({ where: { id } });
      if (!community?.isPublic) return res.status(403).json({ error: 'Not a member' });
    }

    const channels = await prisma.communityChannel.findMany({
      where: { communityId: id },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ channels });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve channels' });
  }
});

// POST /api/communities/:id/channels — create a channel
router.post('/:id/channels', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description = '' } = req.body;
    if (!name || name.trim().length < 1) return res.status(400).json({ error: 'name required' });

    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: id, userId: req.user.id } }
    });
    if (!member || member.role !== 'owner') {
      return res.status(403).json({ error: 'Only the owner can create channels' });
    }

    const community = await prisma.community.findUnique({ where: { id } });

    // Get all member IDs to add to the conversation
    const allMembers = await prisma.communityMember.findMany({
      where: { communityId: id },
      select: { userId: true }
    });

    const channel = await prisma.communityChannel.create({
      data: {
        communityId: id,
        name: name.trim(),
        description: description.trim(),
        conversation: {
          create: {
            type: 'group',
            name: `${community.name} #${name.trim()}`,
            members: { create: allMembers.map(m => ({ userId: m.userId })) }
          }
        }
      }
    });

    res.status(201).json({ channel });
  } catch (err) {
    console.error('Create channel error:', err);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

module.exports = router;
