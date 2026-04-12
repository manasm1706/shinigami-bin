import React, { useState, useRef } from 'react';
import AsciiGifPlayer from '../AsciiGifPlayer/AsciiGifPlayer';
import { saveAsciiGif, convertImageToAscii } from '../../services/asciiGifs';
import type { AsciiGif } from '../../services/asciiGifs';
import './AsciiGifCreator.css';

interface AsciiGifCreatorProps {
  onSave?: (gif: AsciiGif) => void;
  onClose?: () => void;
}

const BLANK_FRAME = '                                        \n'.repeat(8).trimEnd();

const AsciiGifCreator: React.FC<AsciiGifCreatorProps> = ({ onSave, onClose }) => {
  const [title, setTitle] = useState('');
  const [frames, setFrames] = useState<string[]>([BLANK_FRAME]);
  const [activeFrame, setActiveFrame] = useState(0);
  const [frameDelay, setFrameDelay] = useState(150);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateFrame = (value: string) => {
    setFrames(prev => prev.map((f, i) => i === activeFrame ? value : f));
  };

  const addFrame = () => {
    const newFrames = [...frames, BLANK_FRAME];
    setFrames(newFrames);
    setActiveFrame(newFrames.length - 1);
  };

  const removeFrame = (idx: number) => {
    if (frames.length <= 1) return;
    const newFrames = frames.filter((_, i) => i !== idx);
    setFrames(newFrames);
    setActiveFrame(Math.min(activeFrame, newFrames.length - 1));
  };

  const duplicateFrame = () => {
    const newFrames = [...frames];
    newFrames.splice(activeFrame + 1, 0, frames[activeFrame]);
    setFrames(newFrames);
    setActiveFrame(activeFrame + 1);
  };

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
          const { frame } = await convertImageToAscii(base64, 60, 24);
          const newFrames = [...frames];
          newFrames[activeFrame] = frame;
          setFrames(newFrames);
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
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
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

  return (
    <div className="ascii-gif-creator">
      <div className="agc-header">
        <span className="agc-title-label">ASCII GIF CREATOR</span>
        {onClose && (
          <button className="agc-close" onClick={onClose} aria-label="Close">✕</button>
        )}
      </div>

      <div className="agc-body">
        {/* Left: editor */}
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
              onClick={() => fileInputRef.current?.click()}
              disabled={converting}
            >
              {converting ? 'CONVERTING...' : 'IMG → ASCII'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
          </div>

          <div className="agc-field agc-delay-field">
            <label className="agc-label">FRAME DELAY: {frameDelay}ms</label>
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

        {/* Right: preview */}
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
            <AsciiGifPlayer frames={frames} frameDelay={frameDelay} loop title={title || 'Preview'} />
          ) : (
            <AsciiGifPlayer frames={[frames[activeFrame]]} frameDelay={frameDelay} title={`Frame ${activeFrame + 1}`} />
          )}
        </div>
      </div>

      {error && <div className="agc-error">⚠ {error}</div>}

      <div className="agc-footer">
        <button className="agc-btn agc-btn-save" onClick={handleSave} disabled={saving}>
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
