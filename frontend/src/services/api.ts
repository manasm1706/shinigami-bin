const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Default export for legacy service files that do: import API_BASE_URL from './api'
export default BASE_URL;

function getToken(): string | null {
  return localStorage.getItem('shinigami_token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers ?? {}) }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export { BASE_URL };
