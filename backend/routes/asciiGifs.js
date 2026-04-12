const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/ascii-gifs — list all gifs (public)
router.get('/', async (req, res) => {
  try {
    const gifs = await prisma.asciiGif.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { creator: { select: { id: true, username: true } } }
    });
    res.json({ gifs: gifs.map(g => ({ ...g, frames: JSON.parse(g.frames) })) });
  } catch (err) {
    console.error('List ascii gifs error:', err);
    res.status(500).json({ error: 'Failed to retrieve ASCII GIFs' });
  }
});

// POST /api/ascii-gifs — save a new gif
router.post('/', async (req, res) => {
  try {
    const { title, frames, frameDelay = 150, width = 80, height = 24 } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({ error: 'frames array is required' });
    }
    if (frames.length > 120) {
      return res.status(400).json({ error: 'Maximum 120 frames allowed' });
    }

    const gif = await prisma.asciiGif.create({
      data: {
        creatorId: req.user.id,
        title: title.trim(),
        frames: JSON.stringify(frames),
        frameDelay: Math.max(50, Math.min(2000, Number(frameDelay))),
        width: Math.max(10, Math.min(200, Number(width))),
        height: Math.max(5, Math.min(100, Number(height))),
      },
      include: { creator: { select: { id: true, username: true } } }
    });

    res.status(201).json({ gif: { ...gif, frames } });
  } catch (err) {
    console.error('Create ascii gif error:', err);
    res.status(500).json({ error: 'Failed to save ASCII GIF' });
  }
});

// GET /api/ascii-gifs/:id
router.get('/:id', async (req, res) => {
  try {
    const gif = await prisma.asciiGif.findUnique({
      where: { id: req.params.id },
      include: { creator: { select: { id: true, username: true } } }
    });
    if (!gif) return res.status(404).json({ error: 'ASCII GIF not found' });
    res.json({ gif: { ...gif, frames: JSON.parse(gif.frames) } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve ASCII GIF' });
  }
});

// POST /api/ascii-gifs/convert — image-to-ASCII conversion
// Accepts: { imageData: base64 string, width?: number, height?: number }
router.post('/convert', async (req, res) => {
  try {
    const { imageData, width = 80, height = 40 } = req.body;
    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ error: 'imageData (base64) is required' });
    }

    const w = Math.max(10, Math.min(200, Number(width)));
    const h = Math.max(5, Math.min(100, Number(height)));

    // Strip data URL prefix if present
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    let frame;
    try {
      const sharp = require('sharp');
      const { data, info } = await sharp(buffer)
        .resize(w, h, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const ASCII_CHARS = '@#%*+=-:. ';
      let result = '';
      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
          const brightness = data[y * info.width + x] / 255;
          const charIdx = Math.floor(brightness * (ASCII_CHARS.length - 1));
          result += ASCII_CHARS[charIdx];
        }
        result += '\n';
      }
      frame = result.trimEnd();
    } catch {
      // sharp not available — return a placeholder frame
      frame = Array.from({ length: h }, (_, y) =>
        Array.from({ length: w }, (_, x) => (x + y) % 2 === 0 ? '.' : ' ').join('')
      ).join('\n');
    }

    res.json({ frame, width: w, height: h });
  } catch (err) {
    console.error('Convert error:', err);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

module.exports = router;
