const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const os = require('os');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const multer = require('multer');

// multer: store uploads in OS temp dir
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'image/gif', 'video/x-msvideo'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// Terminal green palette — 10 shades from darkest to brightest
// Maps brightness 0 (dark) → 9 (bright) to green shades
const GREEN_SHADES = [
  '#001a00', // 0 — near black
  '#003300', // 1
  '#004d00', // 2
  '#006600', // 3
  '#008000', // 4
  '#009900', // 5
  '#00aa33', // 6
  '#00cc44', // 7
  '#00ee55', // 8
  '#00ff41', // 9 — full terminal green
];

// ASCII chars ordered dark → bright (dense → sparse)
const ASCII_CHARS = '@#%*+=-:. ';

/**
 * Convert a raw grayscale pixel buffer to a monochrome ASCII frame.
 * Returns an array of { char, shade } objects encoded as a special
 * JSON string so the frontend can render colored spans.
 * Format: each line is chars joined, lines joined by \n — plain text.
 * The shade info is embedded as a separate `shades` array parallel to chars.
 */
function bufferToAsciiFrame(data, width, height) {
  let text = '';
  const shadeRows = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    const shadeRow = [];
    for (let x = 0; x < width; x++) {
      const brightness = data[y * width + x] / 255;
      const charIdx = Math.floor(brightness * (ASCII_CHARS.length - 1));
      const shadeIdx = Math.floor(brightness * (GREEN_SHADES.length - 1));
      row += ASCII_CHARS[charIdx];
      shadeRow.push(shadeIdx);
    }
    text += row + '\n';
    shadeRows.push(shadeRow);
  }
  return { text: text.trimEnd(), shades: shadeRows };
}

// All routes require auth
router.use(requireAuth);

// GET /api/ascii-gifs
router.get('/', async (req, res) => {
  try {
    const gifs = await prisma.asciiGif.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { creator: { select: { id: true, username: true } } }
    });
    res.json({ gifs: gifs.map(g => ({ ...g, frames: g.frames })) });
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

    const delay = Math.max(50, Math.min(2000, Number(frameDelay)));
    const maxFrames = Math.floor(10000 / delay); // enforce 10s max
    if (frames.length > maxFrames) {
      return res.status(400).json({
        error: `Too many frames. At ${delay}ms delay, max is ${maxFrames} frames (10 seconds).`
      });
    }

    const gif = await prisma.asciiGif.create({
      data: {
        creatorId: req.user.id,
        title: title.trim(),
        frames: frames,
        frameDelay: delay,
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
    res.json({ gif: { ...gif, frames: gif.frames } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve ASCII GIF' });
  }
});

// POST /api/ascii-gifs/convert — image-to-ASCII (base64 JSON body)
router.post('/convert', async (req, res) => {
  try {
    const { imageData, width = 60, height = 24 } = req.body;
    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ error: 'imageData (base64) is required' });
    }

    const w = Math.max(10, Math.min(200, Number(width)));
    const h = Math.max(5, Math.min(100, Number(height)));
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    try {
      const sharp = require('sharp');
      const { data, info } = await sharp(buffer)
        .resize(w, h, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { text, shades } = bufferToAsciiFrame(data, info.width, info.height);
      res.json({ frame: text, shades, width: w, height: h });
    } catch {
      const frame = Array.from({ length: h }, (_, y) =>
        Array.from({ length: w }, (_, x) => (x + y) % 2 === 0 ? '.' : ' ').join('')
      ).join('\n');
      res.json({ frame, shades: null, width: w, height: h });
    }
  } catch (err) {
    console.error('Convert error:', err);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

// POST /api/ascii-gifs/convert-video — video-to-ASCII (multipart upload)
// Fields: video (file), startTime (float, seconds), endTime (float, seconds),
//         width (int), height (int), frameDelay (int ms)
router.post('/convert-video', upload.single('video'), async (req, res) => {
  const tmpFile = req.file?.path;
  const tmpFrameDir = tmpFile ? `${tmpFile}_frames` : null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'video file is required' });
    }

    const startTime = Math.max(0, parseFloat(req.body.startTime) || 0);
    const endTime = Math.min(parseFloat(req.body.endTime) || 10, startTime + 10);
    const duration = Math.min(endTime - startTime, 10);
    if (duration <= 0) {
      return res.status(400).json({ error: 'Invalid time range' });
    }

    const w = Math.max(10, Math.min(120, parseInt(req.body.width) || 60));
    const h = Math.max(5, Math.min(60, parseInt(req.body.height) || 24));
    const frameDelay = Math.max(50, Math.min(1000, parseInt(req.body.frameDelay) || 100));
    const maxFrames = Math.floor(10000 / frameDelay);
    // Target FPS based on delay, capped so we don't extract too many frames
    const targetFps = Math.min(Math.floor(1000 / frameDelay), 15);

    // Create temp dir for frames
    fs.mkdirSync(tmpFrameDir, { recursive: true });

    // Extract frames with ffmpeg
    await new Promise((resolve, reject) => {
      let ffmpeg;
      try {
        ffmpeg = require('fluent-ffmpeg');
        const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
        ffmpeg.setFfmpegPath(ffmpegPath);
      } catch {
        return reject(new Error('ffmpeg not available'));
      }

      ffmpeg(tmpFile)
        .setStartTime(startTime)
        .setDuration(duration)
        .fps(targetFps)
        .size(`${w * 8}x${h * 14}`) // rough pixel size before ASCII conversion
        .output(path.join(tmpFrameDir, 'frame_%04d.png'))
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Read extracted frames and convert to ASCII
    const frameFiles = fs.readdirSync(tmpFrameDir)
      .filter(f => f.endsWith('.png'))
      .sort()
      .slice(0, maxFrames);

    if (frameFiles.length === 0) {
      return res.status(422).json({ error: 'No frames could be extracted from video' });
    }

    const sharp = require('sharp');
    const frames = [];
    const allShades = [];

    for (const file of frameFiles) {
      const framePath = path.join(tmpFrameDir, file);
      const { data, info } = await sharp(framePath)
        .resize(w, h, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { text, shades } = bufferToAsciiFrame(data, info.width, info.height);
      frames.push(text);
      allShades.push(shades);
    }

    res.json({
      frames,
      shades: allShades,
      frameDelay,
      width: w,
      height: h,
      frameCount: frames.length,
      duration: frames.length * frameDelay / 1000,
    });
  } catch (err) {
    console.error('Video convert error:', err);
    res.status(500).json({ error: 'Video conversion failed', details: err.message });
  } finally {
    // Cleanup temp files
    try {
      if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      if (tmpFrameDir && fs.existsSync(tmpFrameDir)) {
        fs.readdirSync(tmpFrameDir).forEach(f => fs.unlinkSync(path.join(tmpFrameDir, f)));
        fs.rmdirSync(tmpFrameDir);
      }
    } catch { /* non-fatal cleanup */ }
  }
});

module.exports = router;
