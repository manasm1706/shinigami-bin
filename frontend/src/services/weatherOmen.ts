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
 * Fetch weather omen for a city via MCP integration
 * 
 * This function serves as the frontend interface to the weather-omen MCP server.
 * 
 * MCP Integration Flow:
 * 1. Frontend calls this function
 * 2. HTTP request to backend /api/omens/weather endpoint
 * 3. Backend invokes weather-omen MCP server via stdio transport
 * 4. MCP server fetches real weather data and generates mystical interpretation
 * 5. Response flows back through the chain with structured omen data
 * 
 * @param city - The city name to get weather omen for
 * @returns Promise with weather omen data from MCP server
 */
export async function getWeatherOmen(city: string): Promise<WeatherOmenResponse> {
  try {
    console.log(`🌩️ Requesting weather omen from MCP server for: ${city}`);
    
    // =================================================================
    // MCP BACKEND INTEGRATION CALL
    // =================================================================
    // This endpoint bridges to the weather-omen MCP server
    // The backend handles MCP stdio transport and tool invocation
    // =================================================================
    const response = await fetch(`${API_BASE_URL}/omens/weather?city=${encodeURIComponent(city)}`);
    
    if (!response.ok) {
      const error = await response.json();
      
      // Enhanced error handling for MCP-specific issues
      if (response.status === 400) {
        throw new Error(`Invalid city parameter: ${error.error}`);
      } else if (response.status === 500) {
        throw new Error(`MCP server error: ${error.error || 'Weather omen MCP server unavailable'}`);
      } else {
        throw new Error(error.error || 'Failed to fetch weather omen from MCP server');
      }
    }
    
    const data: WeatherOmenResponse = await response.json();
    
    console.log(`✨ MCP weather omen received for ${data.city}: ${data.severity} severity`);
    console.log(`🔮 Omen: "${data.omen}"`);
    
    // Validate MCP response structure
    if (!data.city || !data.omen || !data.severity || !data.weather) {
      throw new Error('Invalid response structure from MCP server');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Weather omen MCP integration error:', error);
    throw error;
  }
}

/**
 * Test the weather omen MCP integration
 * 
 * This function tests the MCP server connectivity and functionality
 * without requiring a specific city parameter.
 * 
 * @returns Promise with MCP test result and server status
 */
export async function testWeatherOmenMCP(): Promise<any> {
  try {
    console.log('🧪 Testing weather-omen MCP server integration...');
    
    const response = await fetch(`${API_BASE_URL}/omens/weather/test`);
    
    if (!response.ok) {
      throw new Error(`MCP test failed with status ${response.status}`);
    }
    
    const testResult = await response.json();
    
    console.log('✅ MCP server test successful:', testResult);
    
    return testResult;
  } catch (error) {
    console.error('❌ MCP server test failed:', error);
    throw error;
  }
}

/**
 * Get MCP server status and capabilities
 * 
 * This function can be used to check if the MCP server is available
 * and what capabilities it provides.
 * 
 * @returns Promise with MCP server status
 */
export async function getMCPServerStatus(): Promise<{
  available: boolean;
  capabilities: string[];
  version?: string;
  lastTest?: string;
}> {
  try {
    await testWeatherOmenMCP();
    
    return {
      available: true,
      capabilities: ['weather_data_fetching', 'omen_interpretation', 'severity_calculation'],
      version: '1.0.0',
      lastTest: new Date().toISOString()
    };
  } catch (error) {
    return {
      available: false,
      capabilities: [],
      lastTest: new Date().toISOString()
    };
  }
}