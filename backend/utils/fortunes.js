// Fortune text generator for Shinigami-bin

const FORTUNE_TEMPLATES = [
  "Your soul dances between worlds",
  "The spirits whisper your name in the darkness",
  "Death's shadow grows longer as the moon wanes",
  "A forgotten memory will resurface from the void",
  "The boundary between realms grows thin around you",
  "Your fate is written in the stars, but the ink is still wet",
  "Three crows will mark the turning point of your journey",
  "The dead speak louder than the living today",
  "Your reflection shows a face you do not recognize",
  "A door you thought closed will creak open tonight",
  "The shinigami watches with interest, but not yet concern",
  "Your name appears in a book you've never read",
  "The veil lifts briefly—what you see cannot be unseen",
  "A debt from a past life comes due",
  "The river of souls flows backwards for you alone",
  "Your shadow moves independently when no one watches",
  "An ancestor reaches out from beyond with a warning",
  "The hourglass of your fate has been turned upside down",
  "You walk the path between life and death today",
  "A spirit follows you, neither friend nor foe",
  "The moon reveals secrets the sun tried to hide",
  "Your fortune is tied to someone you haven't met yet",
  "The shinigami's notebook has a blank page with your name",
  "Today you are closer to the other side than usual",
  "A choice you make today echoes through eternity"
];

const SEVERITY_LEVELS = ['low', 'medium', 'high'];

/**
 * Generate a random fortune
 * @returns {Object} Fortune object with text and severity
 */
function generateFortune() {
  const randomIndex = Math.floor(Math.random() * FORTUNE_TEMPLATES.length);
  const randomSeverity = SEVERITY_LEVELS[Math.floor(Math.random() * SEVERITY_LEVELS.length)];
  
  return {
    fortune: FORTUNE_TEMPLATES[randomIndex],
    severity: randomSeverity
  };
}

/**
 * Generate a personalized fortune for a user
 * @param {string} username - The username to generate fortune for
 * @returns {Object} Complete fortune response
 */
function generateDailyFortune(username) {
  const { fortune, severity } = generateFortune();
  
  return {
    username,
    fortune,
    severity,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get fortune based on severity level
 * @param {string} severityLevel - 'low', 'medium', or 'high'
 * @returns {string} Fortune text matching the severity
 */
function getFortunesBySeverity(severityLevel) {
  const severityMap = {
    low: [
      "Your soul dances between worlds",
      "The spirits whisper your name in the darkness",
      "A forgotten memory will resurface from the void",
      "The moon reveals secrets the sun tried to hide",
      "Your fortune is tied to someone you haven't met yet"
    ],
    medium: [
      "Death's shadow grows longer as the moon wanes",
      "The boundary between realms grows thin around you",
      "Three crows will mark the turning point of your journey",
      "Your reflection shows a face you do not recognize",
      "A spirit follows you, neither friend nor foe"
    ],
    high: [
      "The dead speak louder than the living today",
      "The veil lifts briefly—what you see cannot be unseen",
      "A debt from a past life comes due",
      "The shinigami's notebook has a blank page with your name",
      "A choice you make today echoes through eternity"
    ]
  };

  const fortunes = severityMap[severityLevel] || severityMap.medium;
  return fortunes[Math.floor(Math.random() * fortunes.length)];
}

module.exports = {
  generateFortune,
  generateDailyFortune,
  getFortunesBySeverity,
  FORTUNE_TEMPLATES,
  SEVERITY_LEVELS
};
