import type { RitualDefinition, RitualResult } from '../RitualRegistry';
import { getWeatherOmen } from '../../services/weatherOmen';

/**
 * Weather Omen Ritual - MCP Integration
 * 
 * This ritual integrates with the weather-omen MCP server through the backend API.
 * 
 * MCP Flow:
 * 1. Frontend ritual → Backend API (/api/omens/weather)
 * 2. Backend API → MCP Server (.kiro/mcp/weather-omen/index.js)
 * 3. MCP Server → Weather API + Omen interpretation
 * 4. Response flows back through the chain
 * 
 * The MCP server provides:
 * - Real weather data fetching
 * - Mystical omen interpretation based on conditions
 * - Severity calculation (low/medium/high)
 * - Structured response format
 */
export const weatherOmenRitual: RitualDefinition = {
  id: 'weather_omen',
  name: 'Weather Omen (MCP)',
  description: 'Channel the MCP weather-omen server to interpret celestial signs',
  category: 'omen',
  cooldown: 60000, // 1 minute - prevents MCP server overload
  requiredParams: ['city'],
  
  async execute(params: { city: string }): Promise<RitualResult> {
    try {
      // =================================================================
      // MCP INTEGRATION CALL
      // =================================================================
      // This call goes through the backend MCP adapter which:
      // 1. Validates the city parameter
      // 2. Calls the weather-omen MCP server via stdio transport
      // 3. The MCP server fetches real weather data
      // 4. Interprets weather conditions as mystical omens
      // 5. Returns structured omen data with severity levels
      // =================================================================
      
      console.log(`🌩️ Invoking weather-omen MCP server for city: ${params.city}`);
      
      const omen = await getWeatherOmen(params.city);
      
      console.log(`✨ MCP server responded with ${omen.severity} severity omen for ${omen.city}`);
      
      return {
        id: `omen_${Date.now()}`,
        type: 'weather_omen',
        success: true,
        data: {
          // Core omen data from MCP server
          city: omen.city,
          omen: omen.omen,
          severity: omen.severity,
          
          // Detailed weather data from MCP integration
          weather: {
            condition: omen.weather.condition,
            temperature: omen.weather.temperature,
            description: omen.weather.description,
            humidity: omen.weather.humidity,
            windSpeed: omen.weather.windSpeed
          },
          
          // MCP metadata
          source: omen.source || 'weather-omen-mcp',
          mcpTimestamp: omen.timestamp,
          
          // Ritual metadata
          ritualExecutedAt: new Date().toISOString(),
          mcpIntegration: true
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // Enhanced error handling for MCP integration issues
      const errorMessage = error instanceof Error ? error.message : 'Unknown MCP error';
      
      console.error(`💀 Weather omen MCP integration failed:`, error);
      
      // Provide specific error context for MCP issues
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        throw new Error(`The weather spirits cannot find the city "${params.city}". Ensure the city name is correct.`);
      } else if (errorMessage.includes('500') || errorMessage.includes('server')) {
        throw new Error(`The MCP weather-omen server is experiencing disturbances. The spirits are temporarily unreachable.`);
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        throw new Error(`The ethereal connection to the weather realm has been severed. Check your network connection.`);
      } else {
        throw new Error(`The skies refuse to speak through the MCP conduit: ${errorMessage}`);
      }
    }
  }
};