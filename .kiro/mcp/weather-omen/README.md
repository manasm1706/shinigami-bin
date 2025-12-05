# Weather Omen MCP Server

An MCP (Model Context Protocol) server that fetches weather data and interprets it as spooky omens for the Shinigami-bin platform.

## Features

- Fetches weather data for any city
- Interprets weather conditions as death-themed omens
- Assigns severity levels (low, medium, high) based on conditions
- Combines multiple weather factors (condition, temperature, wind) into layered omens
- Mock mode for testing without API keys

## Installation

```bash
cd .kiro/mcp/weather-omen
npm install
```

## Configuration

### Mock Mode (Default)

By default, the server runs in mock mode with randomly generated weather data. No API key needed.

### Real Weather API

To use real weather data from OpenWeatherMap:

1. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Set the environment variable:
   ```bash
   export OPENWEATHER_API_KEY=your_api_key_here
   ```
3. Set `MOCK_WEATHER_API = false` in `index.js`

## Usage

### As MCP Server

Add to your Kiro MCP configuration (`.kiro/settings/mcp.json`):

```json
{
  "mcpServers": {
    "weather-omen": {
      "command": "node",
      "args": [".kiro/mcp/weather-omen/index.js"],
      "env": {
        "OPENWEATHER_API_KEY": "your_key_here"
      }
    }
  }
}
```

### Tool: get_weather_omen

**Input:**
```json
{
  "city": "Tokyo"
}
```

**Output:**
```json
{
  "city": "Tokyo",
  "omen": "The heavens weep for forgotten souls. The chill of the grave creeps into your bones.",
  "severity": "medium",
  "weather": {
    "condition": "rain",
    "temperature": 5,
    "description": "light rain",
    "humidity": 80,
    "windSpeed": 15
  },
  "timestamp": "2025-12-05T10:30:00.000Z"
}
```

## Weather Condition Mappings

| Condition | Example Omen |
|-----------|--------------|
| Clear | "The sun reveals what shadows tried to hide" |
| Clouds | "The veil between worlds thickens with each passing cloud" |
| Rain | "The heavens weep for forgotten souls" |
| Drizzle | "Gentle tears from the other side" |
| Thunderstorm | "The shinigami's fury shakes the mortal realm" |
| Snow | "Winter's touch brings the cold embrace of death" |
| Mist | "The fog conceals doorways to the other side" |
| Fog | "The veil lifts—or perhaps it descends" |
| Wind | "The breath of the departed stirs the air" |

## Severity Levels

- **Low**: Normal weather conditions (clear, clouds, drizzle)
- **Medium**: Moderate conditions (rain, snow, fog, extreme temps)
- **High**: Severe conditions (thunderstorms, very extreme temps/wind)

## Omen Composition

Omens are composed from multiple factors:

1. **Base Omen**: From primary weather condition
2. **Temperature Modifier**: Added for extreme heat (>30°C) or cold (<0°C)
3. **Wind Modifier**: Added for high winds (>30 km/h)

Example:
- Rain + Cold + High Wind = "The heavens weep for forgotten souls. The chill of the grave creeps into your bones. Restless spirits howl through the mortal realm."

## Testing

Test the MCP server directly:

```bash
node index.js
```

Then send MCP protocol messages via stdin, or use the Kiro IDE to test the tool.

## Integration with Shinigami-bin

This MCP server can be used to:

1. Display weather omens in the chat interface
2. Trigger special events based on weather severity
3. Generate location-based fortunes
4. Add atmospheric effects to the UI based on weather

## Example Usage in Kiro

```
User: What's the weather omen for Seattle?

Kiro: [calls get_weather_omen with city="Seattle"]

Response: "Gray shrouds gather, whispering of things to come. The chill of the grave creeps into your bones."
```

## Future Enhancements

- Historical weather omen tracking
- Weather-based fortune modifiers
- Seasonal omen variations
- Moon phase integration
- Astronomical event omens
