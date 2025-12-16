import API_BASE_URL from './api';

export interface WeatherData {
  condition: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
}

export interface WeatherOmenResponse {
  city: string;
  weather: WeatherData;
  omen: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  source: string;
}

/**
 * Fetch weather omen for a city
 * @param city - The city name to get weather omen for
 * @returns Promise with weather omen data
 */
export async function getWeatherOmen(city: string): Promise<WeatherOmenResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/omens/weather?city=${encodeURIComponent(city)}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch weather omen');
    }
    
    const data: WeatherOmenResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather omen:', error);
    throw error;
  }
}

/**
 * Test the weather omen MCP integration
 * @returns Promise with test result
 */
export async function testWeatherOmenMCP(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/omens/weather/test`);
    
    if (!response.ok) {
      throw new Error('MCP test failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error testing weather omen MCP:', error);
    throw error;
  }
}