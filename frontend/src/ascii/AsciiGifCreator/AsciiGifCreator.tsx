import React, { useState, useRef, useCallback, useEffect } from 'react';
import AsciiGifPlayer from '../AsciiGifPlayer/AsciiGifPlayer';
import { saveAsciiGif, convertImageToAscii, convertVideoToAscii, getAsciiGifs } from '../../services/asciiGifs';
import type { AsciiGif } from '../../services/asciiGifs';
import './AsciiGifCreator.css';

interface AsciiGifCreatorProps {
  onSave?: (gif: AsciiGif) => void;
  onClose?: () => void;
}

type Tab = 'draw' | 'image' | 'video' | 'gallery';

const BLANK_FRAME = Array(12).fill(' '.repeat(40)).join('\n');
const MAX_DURATION_MS = 10000;

const AsciiGifCreator: React.FC<AsciiGifCreatorProps> = ({ onSave, onClose }) => {
  const [tab, setTab] = useState<Tab>('draw');
  const [title, setTitle] = useState('');
  const [frames, setFrames] = useState<string[]>([BLANK_FRAME]);
  const [shades, setShades] = useState<number[][][] | null>(null);
  const [activeFrame, setActiveFrame] = useState(0);
  const [frameDelay, setFrameDelay] = useState(150);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Video crop state
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoStart, setVideoStart] = useState(0);
  const [videoEnd, setVideoEnd] = useState(10);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  // Gallery state
  const [savedGifs, setSavedGifs] = useState<AsciiGif[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [previewGifId, setPreviewGifId] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load gallery when tab switches to gallery
  useEffect(() => {
    if (tab !== 'gallery') return;
    setGalleryLoading(true);
    setGalleryError(null);
    getAsciiGifs()
      .then(({ gifs }) => setSavedGifs(gifs))
      .catch(e => setGalleryError(e instanceof Error ? e.message : 'Failed to load GIFs'))
      .finally(() => setGalleryLoading(false));
  }, [tab]);

  // ── Draw tab helpers ──────────────────────────────────────────────────────
  const updateFrame = (value: string) => {
    setFrames(prev => prev.map((f, i) => i === activeFrame ? value : f));
    setShades(null);
  };

  const addFrame = () => {
    const newFrames = [...frames, BLANK_FRAME];
    setFrames(newFrames);
    setActiveFrame(newFrames.length - 1);
  };

  const removeFrame = (idx: number) => {
    if (frames.length <= 1) return;
    const newFrames = frames.filter((_, i) => i !== idx);
    const newShades = shades ? shades.filter((_, i) => i !== idx) : null;
    setFrames(newFrames);
    setShades(newShades);
    setActiveFrame(Math.min(activeFrame, newFrames.length - 1));
  };

  const duplicateFrame = () => {
    const newFrames = [...frames];
    newFrames.splice(activeFrame + 1, 0, frames[activeFrame]);
    const newShades = shades ? [...shades] : null;
    if (newShades) newShades.splice(activeFrame + 1, 0, shades![activeFrame]);
    setFrames(newFrames);
    setShades(newShades);
    setActiveFrame(activeFrame + 1);
  };

  // ── Image → ASCII ─────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setConverting(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        try {
          const { frame, shades: frameShades } = await convertImageToAscii(base64, 60, 24);
          const newFrames = [...frames];
          newFrames[activeFrame] = frame;
          setFrames(newFrames);
          if (frameShades) {
            const newShades = shades ? [...shades] : Array(frames.length).fill(null);
            newShades[activeFrame] = frameShades;
            setShades(newShades as number[][][]);
          }
        } catch {
          setError('Image conversion failed');
        } finally {
          setConverting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setError('Failed to read image');
      setConverting(false);
    }
    e.target.value = '';
  };

  // ── Video handling ────────────────────────────────────────────────────────
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setError(null);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    setVideoStart(0);
    setVideoEnd(10);
  };

  const handleVideoLoaded = () => {
    const dur = videoRef.current?.duration ?? 0;
    setVideoDuration(dur);
    setVideoEnd(Math.min(dur, 10));
  };

  const handleConvertVideo = useCallback(async () => {
    if (!videoFile) { setError('Select a video first'); return; }
    const duration = videoEnd - videoStart;
    if (duration <= 0 || duration > 10) {
      setError('Clip must be between 0 and 10 seconds');
      return;
    }
    setConverting(true);
    setConvertProgress(0);
    setError(null);
    try {
      const result = await convertVideoToAscii(
        videoFile, videoStart, videoEnd, 60, 24, frameDelay,
        (pct) => setConvertProgress(pct)
      );
      setFrames(result.frames);
      setShades(result.shades ?? null);
      setActiveFrame(0);
      setTab('draw');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video conversion failed');
    } finally {
      setConverting(false);
      setConvertProgress(0);
    }
  }, [videoFile, videoStart, videoEnd, frameDelay]);

  // ── Gallery: load a saved GIF into the editor ─────────────────────────────
  const handleUseGif = (gif: AsciiGif) => {
    setFrames(gif.frames);
    setShades(null);
    setTitle(gif.title);
    setFrameDelay(gif.frameDelay);
    setActiveFrame(0);
    setTab('draw');
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    const maxFrames = Math.floor(MAX_DURATION_MS / frameDelay);
    if (frames.length > maxFrames) {
      setError(`Too many frames. At ${frameDelay}ms, max is ${maxFrames} frames (10s).`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { gif } = await saveAsciiGif({ title: title.trim(), frames, frameDelay });
      onSave?.(gif);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const totalDurationMs = frames.length * frameDelay;
  const overLimit = totalDurationMs > MAX_DURATION_MS;

  const TAB_LABELS: Record<Tab, string> = {
    draw: '✏ DRAW',
    image: '🖼 IMG→ASCII',
    video: '🎬 VIDEO→ASCII',
    gallery: '📁 MY GIFS',
  };

  return (
    <div className="ascii-gif-creator">
      <div className="agc-header">
        <span className="agc-title-label">ASCII GIF CREATOR</span>
        {onClose && (
          <button className="agc-close" onClick={onClose} aria-label="Close">✕</button>
        )}
      </div>

      {/* Tab bar */}
      <div className="agc-tabs">
        {(['draw', 'image', 'video', 'gallery'] as Tab[]).map(t => (
          <button
            key={t}
            className={`agc-tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── GALLERY TAB (full-width, no split layout) ── */}
      {tab === 'gallery' ? (
        <div className="agc-gallery">
          <div className="agc-gallery-header">
            <span className="agc-label">YOUR SAVED ASCII GIFS</span>
            <button
              className="agc-btn"
              onClick={() => {
                setGalleryLoading(true);
                getAsciiGifs()
                  .then(({ gifs }) => setSavedGifs(gifs))
                  .catch(e => setGalleryError(e instanceof Error ? e.message : 'Failed'))
                  .finally(() => setGalleryLoading(false));
              }}
              disabled={galleryLoading}
            >
              ↺ REFRESH
            </button>
          </div>

          {galleryError && <div className="agc-error">⚠ {galleryError}</div>}

          {galleryLoading ? (
            <div className="agc-gallery-loading">◆ ◇ ◆ Loading your GIFs...</div>
          ) : savedGifs.length === 0 ? (
            <div className="agc-gallery-empty">
              <div className="agc-gallery-empty-art">
                ╔══════════════════╗{'\n'}
                ║  NO GIFS YET     ║{'\n'}
                ║  CREATE ONE!     ║{'\n'}
                ╚══════════════════╝
              </div>
              <p>Switch to DRAW, IMG→ASCII, or VIDEO→ASCII to create your first GIF.</p>
            </div>
          ) : (
            <div className="agc-gallery-grid">
              {savedGifs.map(gif => (
                <div
                  key={gif.id}
                  className={`agc-gallery-item ${previewGifId === gif.id ? 'expanded' : ''}`}
                >
                  <div className="agc-gallery-item-header">
                    <span className="agc-gallery-title">{gif.title}</span>
                    <span className="agc-gallery-meta">
                      {gif.frames.length}f · {gif.frameDelay}ms · {(gif.frames.length * gif.frameDelay / 1000).toFixed(1)}s
                    </span>
                  </div>

                  {/* Inline preview — always playing */}
                  <div
                    className="agc-gallery-preview"
                    onClick={() => setPreviewGifId(p => p === gif.id ? null : gif.id)}
                  >
                    <AsciiGifPlayer
                      frames={gif.frames}
                      frameDelay={gif.frameDelay}
                      compact
                    />
                    <div className="agc-gallery-preview-hint">
                      {previewGifId === gif.id ? '▲ COLLAPSE' : '▼ EXPAND'}
                    </div>
                  </div>

                  {previewGifId === gif.id && (
                    <div className="agc-gallery-expanded">
                      <AsciiGifPlayer
                        frames={gif.frames}
                        frameDelay={gif.frameDelay}
                        title={gif.title}
                      />
                    </div>
                  )}

                  <div className="agc-gallery-actions">
                    <button
                      className="agc-btn agc-btn-primary"
                      onClick={() => handleUseGif(gif)}
                      title="Load into editor"
                    >
                      ↗ USE IN EDITOR
                    </button>
                    <button
                      className="agc-btn"
                      onClick={() => {
                        if (onSave) onSave(gif);
                      }}
                      title="Send to chat"
                    >
                      ▶ SEND TO CHAT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── DRAW / IMAGE / VIDEO TABS ── */
        <>
          <div className="agc-body">
            {/* LEFT: editor / video */}
            <div className="agc-editor-col">
              <div className="agc-field">
                <label className="agc-label">TITLE:</label>
                <input
                  className="agc-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="my-ascii-gif"
                />
              </div>

              {tab === 'draw' && (
                <>
                  <div className="agc-frame-tabs">
                    {frames.map((_, i) => (
                      <button
                        key={i}
                        className={`agc-tab ${i === activeFrame ? 'active' : ''}`}
                        onClick={() => setActiveFrame(i)}
                      >
                        {i + 1}
                        {frames.length > 1 && (
                          <span
                            className="agc-tab-remove"
                            onClick={e => { e.stopPropagation(); removeFrame(i); }}
                          >×</span>
                        )}
                      </button>
                    ))}
                    <button className="agc-tab agc-tab-add" onClick={addFrame} title="Add frame">+</button>
                  </div>

                  <textarea
                    className="agc-textarea"
                    value={frames[activeFrame]}
                    onChange={e => updateFrame(e.target.value)}
                    spellCheck={false}
                    rows={12}
                  />

                  <div className="agc-frame-actions">
                    <button className="agc-btn" onClick={duplicateFrame}>DUP FRAME</button>
                    <button
                      className="agc-btn"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={converting}
                    >
                      {converting ? 'CONVERTING...' : 'IMG → ASCII'}
                    </button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageUpload}
                    />
                  </div>
                </>
              )}

              {tab === 'image' && (
                <div className="agc-image-tab">
                  <p className="agc-hint">Upload an image to convert the current frame to ASCII art.</p>
                  <button
                    className="agc-btn agc-btn-upload"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={converting}
                  >
                    {converting ? `CONVERTING... ${convertProgress}%` : '🖼 CHOOSE IMAGE'}
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                  {converting && (
                    <div className="agc-progress">
                      <div className="agc-progress-bar" style={{ width: `${convertProgress}%` }} />
                    </div>
                  )}
                </div>
              )}

              {tab === 'video' && (
                <div className="agc-video-tab">
                  <p className="agc-hint">Upload a video (mp4/webm). Crop to max 10 seconds, then convert to ASCII frames.</p>
                  <button
                    className="agc-btn agc-btn-upload"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={converting}
                  >
                    🎬 CHOOSE VIDEO
                  </button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,image/gif"
                    style={{ display: 'none' }}
                    onChange={handleVideoSelect}
                  />

                  {videoPreviewUrl && (
                    <>
                      <video
                        ref={videoRef}
                        src={videoPreviewUrl}
                        className="agc-video-preview"
                        onLoadedMetadata={handleVideoLoaded}
                        muted
                        playsInline
                      />
                      <div className="agc-crop-controls">
                        <div className="agc-crop-row">
                          <label className="agc-label">START: {videoStart.toFixed(1)}s</label>
                          <input
                            type="range"
                            min={0}
                            max={Math.max(0, videoDuration - 0.1)}
                            step={0.1}
                            value={videoStart}
                            onChange={e => {
                              const v = parseFloat(e.target.value);
                              setVideoStart(v);
                              if (videoEnd - v > 10) setVideoEnd(v + 10);
                              if (videoEnd <= v) setVideoEnd(Math.min(v + 0.5, videoDuration));
                            }}
                            className="agc-slider"
                          />
                        </div>
                        <div className="agc-crop-row">
                          <label className="agc-label">
                            END: {videoEnd.toFixed(1)}s &nbsp;
                            <span className={`agc-duration-badge ${videoEnd - videoStart > 10 ? 'over' : ''}`}>
                              {(videoEnd - videoStart).toFixed(1)}s / 10s max
                            </span>
                          </label>
                          <input
                            type="range"
                            min={videoStart + 0.1}
                            max={videoDuration}
                            step={0.1}
                            value={videoEnd}
                            onChange={e => setVideoEnd(Math.min(parseFloat(e.target.value), videoStart + 10))}
                            className="agc-slider"
                          />
                        </div>
                      </div>
                      <button
                        className="agc-btn agc-btn-convert"
                        onClick={handleConvertVideo}
                        disabled={converting || videoEnd - videoStart <= 0}
                      >
                        {converting ? `CONVERTING... ${convertProgress}%` : '⚡ CONVERT TO ASCII'}
                      </button>
                      {converting && (
                        <div className="agc-progress">
                          <div className="agc-progress-bar" style={{ width: `${convertProgress}%` }} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="agc-field agc-delay-field">
                <label className="agc-label">
                  FRAME DELAY: {frameDelay}ms &nbsp;
                  <span className={`agc-duration-badge ${overLimit ? 'over' : ''}`}>
                    {(totalDurationMs / 1000).toFixed(1)}s / 10s max
                  </span>
                </label>
                <input
                  type="range"
                  min={50}
                  max={1000}
                  step={50}
                  value={frameDelay}
                  onChange={e => setFrameDelay(Number(e.target.value))}
                  className="agc-slider"
                />
              </div>
            </div>

            {/* RIGHT: preview */}
            <div className="agc-preview-col">
              <div className="agc-label">PREVIEW</div>
              <div className="agc-preview-toggle">
                <button
                  className={`agc-btn ${previewing ? 'active' : ''}`}
                  onClick={() => setPreviewing(p => !p)}
                >
                  {previewing ? '⏸ PAUSE' : '▶ PLAY'}
                </button>
              </div>
              {previewing ? (
                <AsciiGifPlayer frames={frames} shades={shades} frameDelay={frameDelay} title={title || 'Preview'} />
              ) : (
                <AsciiGifPlayer frames={[frames[activeFrame]]} shades={shades ? [shades[activeFrame]] : null} frameDelay={frameDelay} title={`Frame ${activeFrame + 1}/${frames.length}`} />
              )}
              <div className="agc-frame-count">
                {frames.length} frame{frames.length !== 1 ? 's' : ''} · {(totalDurationMs / 1000).toFixed(1)}s
              </div>
            </div>
          </div>

          {error && <div className="agc-error">⚠ {error}</div>}
          {overLimit && (
            <div className="agc-warning">
              ⚠ Total duration exceeds 10s. Reduce frames or increase frame delay before saving.
            </div>
          )}

          <div className="agc-footer">
            <button className="agc-btn agc-btn-save" onClick={handleSave} disabled={saving || overLimit}>
              {saving ? 'SAVING...' : '💾 SAVE GIF'}
            </button>
            {onClose && <button className="agc-btn" onClick={onClose}>CANCEL</button>}
          </div>
        </>
      )}
    </div>
  );
};

export default AsciiGifCreator;
