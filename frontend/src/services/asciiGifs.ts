import { apiFetch } from './api';

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
  width = 80,
  height = 40
): Promise<{ frame: string; width: number; height: number }> {
  return apiFetch('/ascii-gifs/convert', {
    method: 'POST',
    body: JSON.stringify({ imageData, width, height })
  });
}
