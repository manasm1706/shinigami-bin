const express = require('express');
const router = express.Router();
const { validateCity, createValidationMiddleware } = require('../utils/inputValidation');

// â”€â”€ Real weather via Open-Meteo (free, no API key) + geocoding via nominatim â”€â”€

const WEATHER_OMENS = {
  clear: [
    "The sun reveals what shadows tried to hide",
    "Clear skies deceive â€” the spirits are merely watching",
    "Brightness blinds mortals to the approaching darkness",
  ],
  clouds: [
    "The veil between worlds thickens with each passing cloud",
    "Gray shrouds gather, whispering of things to come",
    "Clouds carry the weight of unspoken prophecies",
  ],
  rain: [
    "The heavens weep for forgotten souls",
    "Each drop carries a memory from the beyond",
    "Rain washes away the boundary between life and death",
  ],
  drizzle: [
    "Gentle tears from the other side",
    "The spirits whisper through misty veils",
    "A soft rain of sorrows descends",
  ],
  thunderstorm: [
    "The shinigami's fury shakes the mortal realm",
    "Lightning marks the souls claimed this hour",
    "Thunder echoes the screams of the damned",
  ],
  snow: [
    "Winter's touch brings the cold embrace of death",
    "Each snowflake is a soul returning to earth",
    "The world freezes as the boundary grows thin",
  ],
  mist: [
    "The fog conceals doorways to the other side",
    "Spirits walk freely when the mist descends",
    "Visibility fades as the dead draw near",
  ],
  fog: [
    "The veil lifts â€” or perhaps it descends",
    "In the fog, the living and dead walk together",
    "Thick mists hide what should remain hidden",
  ],
};

// WMO weather code â†’ condition string
function wmoToCondition(code) {
  if (code === 0) return 'clear';
  if (code <= 3) return 'clouds';
  if (code <= 49) return 'mist';
  if (code <= 59) return 'drizzle';
  if (code <= 69) return 'rain';
  if (code <= 79) return 'snow';
  if (code <= 82) return 'rain';
  if (code <= 99) return 'thunderstorm';
  return 'clouds';
}

async function fetchRealWeather(city) {
  // 1. Geocode city â†’ lat/lon via Nominatim
  const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
  const geoRes = await fetch(geoUrl, {
    headers: { 'User-Agent': 'shinigami-bin/1.0 (weather-omen-ritual)' }
  });
  if (!geoRes.ok) throw new Error('Geocoding failed');
  const geoData = await geoRes.json();
  if (!geoData.length) throw new Error(`City not found: ${city}`);

  const { lat, lon, display_name } = geoData[0];

  // 2. Fetch current weather from Open-Meteo
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh`;
  const weatherRes = await fetch(weatherUrl);
  if (!weatherRes.ok) throw new Error('Weather fetch failed');
  const weatherData = await weatherRes.json();

  const current = weatherData.current;
  const condition = wmoToCondition(current.weather_code);
  const temperature = Math.round(current.temperature_2m);
  const humidity = current.relative_humidity_2m;
  const windSpeed = Math.round(current.wind_speed_10m);

  // Determine severity
  let severity = 'low';
  if (condition === 'thunderstorm' || temperature < -10 || windSpeed > 50) {
    severity = 'high';
  } else if (['rain', 'snow', 'fog'].includes(condition) || temperature < 0 || windSpeed > 30) {
    severity = 'medium';
  }

  const omens = WEATHER_OMENS[condition] || WEATHER_OMENS.clouds;
  const omen = omens[Math.floor(Math.random() * omens.length)];

  return {
    city: display_name.split(',')[0].trim(),
    omen,
    severity,
    weather: {
      condition,
      temperature,
      description: `${condition} (WMO ${current.weather_code})`,
      humidity,
      windSpeed,
    },
    timestamp: new Date().toISOString(),
    source: 'open-meteo',
  };
}

// Fallback mock (used if real API fails)
async function mockWeather(city) {
  const conditions = Object.keys(WEATHER_OMENS);
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  const omens = WEATHER_OMENS[condition];
  return {
    city,
    omen: omens[Math.floor(Math.random() * omens.length)],
    severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    weather: {
      condition,
      temperature: Math.floor(Math.random() * 40) - 10,
      description: `${condition} (mock)`,
      humidity: Math.floor(Math.random() * 100),
      windSpeed: Math.floor(Math.random() * 30),
    },
    timestamp: new Date().toISOString(),
    source: 'mock-fallback',
  };
}

router.get('/weather',
  createValidationMiddleware({ query: { city: validateCity } }),
  async (req, res) => {
    try {
      const { city } = req.query;
      let data;
      try {
        data = await fetchRealWeather(city);
      } catch (apiErr) {
        console.warn('âš ï¸ Real weather API failed, using mock:', apiErr.message);
        data = await mockWeather(city);
      }
      res.json(data);
    } catch (err) {
      console.error('Weather omen error:', err);
      res.status(500).json({ error: 'Failed to retrieve weather omen', details: err.message });
    }
  }
);

router.get('/weather/test', async (req, res) => {
  try {
    const city = 'Tokyo';
    let data;
    try {
      data = await fetchRealWeather(city);
    } catch {
      data = await mockWeather(city);
    }
    res.json({ message: 'Weather Omen Test', testCity: city, result: data });
  } catch (err) {
    res.status(500).json({ error: 'Test failed', details: err.message });
  }
});

module.exports = router;
