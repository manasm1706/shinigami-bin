import React, { useState, useRef, useCallback } from 'react';
import AsciiGifPlayer from '../AsciiGifPlayer/AsciiGifPlayer';
import { saveAsciiGif, convertImageToAscii, convertVideoToAscii } from '../../services/asciiGifs';
import type { AsciiGif } from '../../services/asciiGifs';
import './AsciiGifCreator.css';

interface AsciiGifCreatorProps {
  onSave?: (gif: AsciiGif) => void;
  onClose?: () => void;
}

type Tab = 'draw' | 'image' | 'video';

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

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── Draw tab helpers ──────────────────────────────────────────────────────
  const updateFrame = (value: string) => {
    setFrames(prev => prev.map((f, i) => i === activeFrame ? value : f));
    setShades(null); // clear shades when manually editing
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
      setTab('draw'); // switch to draw tab to review
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video conversion failed');
    } finally {
      setConverting(false);
      setConvertProgress(0);
    }
  }, [videoFile, videoStart, videoEnd, frameDelay]);

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
        {(['draw', 'image', 'video'] as Tab[]).map(t => (
          <button
            key={t}
            className={`agc-tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'draw' ? '✏ DRAW' : t === 'image' ? '🖼 IMG→ASCII' : '🎬 VIDEO→ASCII'}
          </button>
        ))}
      </div>

      <div className="agc-body">
        {/* ── LEFT: editor / video ── */}
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
                      <label className="agc-label">
                        START: {videoStart.toFixed(1)}s
                      </label>
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
                        onChange={e => {
                          const v = parseFloat(e.target.value);
                          setVideoEnd(Math.min(v, videoStart + 10));
                        }}
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

        {/* ── RIGHT: preview ── */}
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
            <AsciiGifPlayer
              frames={frames}
              shades={shades}
              frameDelay={frameDelay}
              title={title || 'Preview'}
            />
          ) : (
            <AsciiGifPlayer
              frames={[frames[activeFrame]]}
              shades={shades ? [shades[activeFrame]] : null}
              frameDelay={frameDelay}
              title={`Frame ${activeFrame + 1}/${frames.length}`}
            />
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
        <button
          className="agc-btn agc-btn-save"
          onClick={handleSave}
          disabled={saving || overLimit}
        >
          {saving ? 'SAVING...' : '💾 SAVE GIF'}
        </button>
        {onClose && (
          <button className="agc-btn" onClick={onClose}>CANCEL</button>
        )}
      </div>
    </div>
  );
};

export default AsciiGifCreator;
