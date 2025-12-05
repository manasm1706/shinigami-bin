import API_BASE_URL from './api';

export interface FortuneResponse {
  username: string;
  fortune: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

/**
 * Fetch daily fortune for a user
 * @param username - The username to get fortune for
 * @returns Promise with fortune data
 */
export async function getDailyFortune(username: string): Promise<FortuneResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/fortune/daily?username=${encodeURIComponent(username)}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch fortune');
    }
    
    const data: FortuneResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching fortune:', error);
    throw error;
  }
}
