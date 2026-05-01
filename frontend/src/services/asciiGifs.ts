import { apiFetch, BASE_URL } from './api';

export interface AsciiGif {
  id: string;
  title: string;
  frames: string[];
  frameDelay: number;
  width: number;
  height: number;
  createdAt: string;
  creator: { id: string; username: string };
}

export interface AsciiFrame {
  text: string;
  /** Per-row, per-char shade index 0–9 into GREEN_SHADES palette */
  shades: number[][] | null;
}

export function getAsciiGifs(): Promise<{ gifs: AsciiGif[] }> {
  return apiFetch('/ascii-gifs');
}

export function getAsciiGif(id: string): Promise<{ gif: AsciiGif }> {
  return apiFetch(`/ascii-gifs/${id}`);
}

export function saveAsciiGif(data: {
  title: string;
  frames: string[];
  frameDelay?: number;
  width?: number;
  height?: number;
}): Promise<{ gif: AsciiGif }> {
  return apiFetch('/ascii-gifs', { method: 'POST', body: JSON.stringify(data) });
}

export function convertImageToAscii(
  imageData: string,
  width = 60,
  height = 24
): Promise<{ frame: string; shades: number[][] | null; width: number; height: number }> {
  return apiFetch('/ascii-gifs/convert', {
    method: 'POST',
    body: JSON.stringify({ imageData, width, height })
  });
}

export async function convertVideoToAscii(
  file: File,
  startTime: number,
  endTime: number,
  width = 60,
  height = 24,
  frameDelay = 100,
  onProgress?: (pct: number) => void
): Promise<{
  frames: string[];
  shades: number[][][] | null;
  frameDelay: number;
  width: number;
  height: number;
  frameCount: number;
  duration: number;
}> {
  const token = localStorage.getItem('shinigami_token');
  const formData = new FormData();
  formData.append('video', file);
  formData.append('startTime', String(startTime));
  formData.append('endTime', String(endTime));
  formData.append('width', String(width));
  formData.append('height', String(height));
  formData.append('frameDelay', String(frameDelay));

  // Use XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/ascii-gifs/convert-video`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 80)); // upload = 0–80%
      }
    };

    xhr.onload = () => {
      if (onProgress) onProgress(100);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error || `HTTP ${xhr.status}`));
        } catch {
          reject(new Error(`HTTP ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during video upload'));
    xhr.send(formData);
  });
}
