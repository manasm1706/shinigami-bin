#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

// Weather to omen mappings
const WEATHER_OMENS = {
  clear: [
    "The sun reveals what shadows tried to hide",
    "Clear skies deceive—the spirits are merely watching",
    "Brightness blinds mortals to the approaching darkness",
    "The heavens offer no shelter today"
  ],
  clouds: [
    "The veil between worlds thickens with each passing cloud",
    "Gray shrouds gather, whispering of things to come",
    "The sky conceals its secrets behind ashen curtains",
    "Clouds carry the weight of unspoken prophecies"
  ],
  rain: [
    "The heavens weep for forgotten souls",
    "Each drop carries a memory from the beyond",
    "The sky mourns what the earth has lost",
    "Rain washes away the boundary between life and death"
  ],
  drizzle: [
    "Gentle tears from the other side",
    "The spirits whisper through misty veils",
    "A soft rain of sorrows descends",
    "The dead send their regards, drop by drop"
  ],
  thunderstorm: [
    "The shinigami's fury shakes the mortal realm",
    "Lightning marks the souls claimed this hour",
    "Thunder echoes the screams of the damned",
    "The storm carries the rage of restless spirits"
  ],
  snow: [
    "Winter's touch brings the cold embrace of death",
    "Each snowflake is a soul returning to earth",
    "The world freezes as the boundary grows thin",
    "White silence blankets the realm of the living"
  ],
  mist: [
    "The fog conceals doorways to the other side",
    "Spirits walk freely when the mist descends",
    "Visibility fades as the dead draw near",
    "The boundary dissolves into gray uncertainty"
  ],
  fog: [
    "The veil lifts—or perhaps it descends",
    "In the fog, the living and dead walk together",
    "Thick mists hide what should remain hidden",
    "The world between worlds manifests in gray"
  ],
  wind: [
    "The breath of the departed stirs the air",
    "Whispers from beyond ride the wind",
    "Restless spirits howl through the mortal realm",
    "The wind carries messages you'd rather not hear"
  ],
  hot: [
    "The heat of a thousand burning souls rises",
    "Hellfire seeps through the cracks of reality",
    "The underworld's warmth reaches the surface",
    "Even the sun cannot escape death's influence"
  ],
  cold: [
    "The chill of the grave creeps into your bones",
    "Death's icy fingers reach across the threshold",
    "The cold reminds all mortals of their fate",
    "Winter's touch is merely death's preview"
  ]
};

// Mock weather API (replace with real API like OpenWeatherMap)
const MOCK_WEATHER_API = true;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';

/**
 * Fetch weather data for a city
 */
async function fetchWeather(city) {
  if (MOCK_WEATHER_API) {
    // Mock weather data for testing
    const mockConditions = ['clear', 'clouds', 'rain', 'thunderstorm', 'snow', 'mist'];
    const randomCondition = mockConditions[Math.floor(Math.random() * mockConditions.length)];
    const randomTemp = Math.floor(Math.random() * 40) - 10; // -10 to 30°C
    
    return {
      city,
      condition: randomCondition,
      temperature: randomTemp,
      description: `Mock ${randomCondition} weather`,
      humidity: Math.floor(Math.random() * 100),
      windSpeed: Math.floor(Math.random() * 30)
    };
  }

  // Real API call (requires API key)
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OPENWEATHER_API_KEY environment variable not set');
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    city: data.name,
    condition: data.weather[0].main.toLowerCase(),
    temperature: Math.round(data.main.temp),
    description: data.weather[0].description,
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed * 3.6) // m/s to km/h
  };
}

/**
 * Interpret weather as a spooky omen
 */
function interpretWeatherAsOmen(weatherData) {
  const { condition, temperature, windSpeed } = weatherData;
  
  // Get base omen from condition
  let omens = WEATHER_OMENS[condition] || WEATHER_OMENS.clouds;
  let baseOmen = omens[Math.floor(Math.random() * omens.length)];
  
  // Add temperature-based modifier
  let tempModifier = '';
  if (temperature > 30) {
    const hotOmens = WEATHER_OMENS.hot;
    tempModifier = hotOmens[Math.floor(Math.random() * hotOmens.length)];
  } else if (temperature < 0) {
    const coldOmens = WEATHER_OMENS.cold;
    tempModifier = coldOmens[Math.floor(Math.random() * coldOmens.length)];
  }
  
  // Add wind-based modifier
  let windModifier = '';
  if (windSpeed > 30) {
    const windOmens = WEATHER_OMENS.wind;
    windModifier = windOmens[Math.floor(Math.random() * windOmens.length)];
  }
  
  // Combine omens
  const omenParts = [baseOmen, tempModifier, windModifier].filter(Boolean);
  const fullOmen = omenParts.join('. ') + '.';
  
  return {
    omen: fullOmen,
    severity: getSeverity(condition, temperature, windSpeed),
    weatherData
  };
}

/**
 * Determine omen severity based on weather conditions
 */
function getSeverity(condition, temperature, windSpeed) {
  // High severity conditions
  if (condition === 'thunderstorm' || temperature < -10 || temperature > 40 || windSpeed > 50) {
    return 'high';
  }
  
  // Medium severity conditions
  if (condition === 'rain' || condition === 'snow' || condition === 'fog' || 
      temperature < 0 || temperature > 35 || windSpeed > 30) {
    return 'medium';
  }
  
  // Low severity (default)
  return 'low';
}

// Create MCP server
const server = new Server(
  {
    name: 'weather-omen-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_weather_omen',
        description: 'Fetch weather for a city and interpret it as a spooky omen in the style of Shinigami-bin',
        inputSchema: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              description: 'Name of the city to get weather omen for',
            },
          },
          required: ['city'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'get_weather_omen') {
    const city = request.params.arguments?.city;
    
    if (!city || typeof city !== 'string') {
      throw new Error('City name is required and must be a string');
    }

    try {
      // Fetch weather data
      const weatherData = await fetchWeather(city);
      
      // Interpret as omen
      const omenResult = interpretWeatherAsOmen(weatherData);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              city: weatherData.city,
              omen: omenResult.omen,
              severity: omenResult.severity,
              weather: {
                condition: weatherData.condition,
                temperature: weatherData.temperature,
                description: weatherData.description,
                humidity: weatherData.humidity,
                windSpeed: weatherData.windSpeed
              },
              timestamp: new Date().toISOString()
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: error.message,
              city
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Weather Omen MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
