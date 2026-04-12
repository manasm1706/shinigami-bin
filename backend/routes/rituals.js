const express = require('express');
const router = express.Router();

// ── Tarot ──────────────────────────────────────────────────────────────────
const TAROT_DECK = [
  { name: 'The Fool', arcana: 'major', upright: 'New beginnings, innocence, spontaneity', reversed: 'Recklessness, risk, negligence', number: 0 },
  { name: 'The Magician', arcana: 'major', upright: 'Willpower, desire, creation, manifestation', reversed: 'Trickery, illusions, out of touch', number: 1 },
  { name: 'The High Priestess', arcana: 'major', upright: 'Intuition, sacred knowledge, divine feminine', reversed: 'Secrets, disconnected from intuition', number: 2 },
  { name: 'The Empress', arcana: 'major', upright: 'Femininity, beauty, nature, abundance', reversed: 'Creative block, dependence on others', number: 3 },
  { name: 'The Emperor', arcana: 'major', upright: 'Authority, establishment, structure, father figure', reversed: 'Domination, excessive control, rigidity', number: 4 },
  { name: 'The Hierophant', arcana: 'major', upright: 'Spiritual wisdom, tradition, conformity', reversed: 'Personal beliefs, freedom, challenging the status quo', number: 5 },
  { name: 'The Lovers', arcana: 'major', upright: 'Love, harmony, relationships, values alignment', reversed: 'Self-love, disharmony, imbalance', number: 6 },
  { name: 'The Chariot', arcana: 'major', upright: 'Control, willpower, success, action', reversed: 'Self-discipline, opposition, lack of direction', number: 7 },
  { name: 'Strength', arcana: 'major', upright: 'Strength, courage, persuasion, influence', reversed: 'Inner strength, self-doubt, low energy', number: 8 },
  { name: 'The Hermit', arcana: 'major', upright: 'Soul-searching, introspection, being alone', reversed: 'Isolation, loneliness, withdrawal', number: 9 },
  { name: 'Wheel of Fortune', arcana: 'major', upright: 'Good luck, karma, life cycles, destiny', reversed: 'Bad luck, resistance to change, breaking cycles', number: 10 },
  { name: 'Justice', arcana: 'major', upright: 'Justice, fairness, truth, cause and effect', reversed: 'Unfairness, lack of accountability, dishonesty', number: 11 },
  { name: 'The Hanged Man', arcana: 'major', upright: 'Pause, surrender, letting go, new perspectives', reversed: 'Delays, resistance, stalling', number: 12 },
  { name: 'Death', arcana: 'major', upright: 'Endings, change, transformation, transition', reversed: 'Resistance to change, personal transformation', number: 13 },
  { name: 'Temperance', arcana: 'major', upright: 'Balance, moderation, patience, purpose', reversed: 'Imbalance, excess, self-healing', number: 14 },
  { name: 'The Devil', arcana: 'major', upright: 'Shadow self, attachment, addiction, restriction', reversed: 'Releasing limiting beliefs, exploring dark thoughts', number: 15 },
  { name: 'The Tower', arcana: 'major', upright: 'Sudden change, upheaval, chaos, revelation', reversed: 'Personal transformation, fear of change', number: 16 },
  { name: 'The Star', arcana: 'major', upright: 'Hope, faith, purpose, renewal, spirituality', reversed: 'Lack of faith, despair, self-trust', number: 17 },
  { name: 'The Moon', arcana: 'major', upright: 'Illusion, fear, the unconscious, intuition', reversed: 'Release of fear, repressed emotion, inner confusion', number: 18 },
  { name: 'The Sun', arcana: 'major', upright: 'Positivity, fun, warmth, success, vitality', reversed: 'Inner child, feeling down, overly optimistic', number: 19 },
  { name: 'Judgement', arcana: 'major', upright: 'Judgement, rebirth, inner calling, absolution', reversed: 'Self-doubt, inner critic, ignoring the call', number: 20 },
  { name: 'The World', arcana: 'major', upright: 'Completion, integration, accomplishment, travel', reversed: 'Seeking personal closure, short-cuts', number: 21 },
];

const SPREAD_POSITIONS = ['Past', 'Present', 'Future'];

// GET /api/rituals/tarot — draw a 3-card spread
router.get('/tarot', (req, res) => {
  const shuffled = [...TAROT_DECK].sort(() => Math.random() - 0.5);
  const drawn = shuffled.slice(0, 3).map((card, i) => ({
    position: SPREAD_POSITIONS[i],
    card: card.name,
    arcana: card.arcana,
    number: card.number,
    reversed: Math.random() > 0.6,
    meaning: Math.random() > 0.6 ? card.reversed : card.upright,
  }));

  const severity = drawn.some(c => ['Death', 'The Tower', 'The Devil'].includes(c.card))
    ? 'high'
    : drawn.some(c => ['The Moon', 'The Hanged Man', 'Judgement'].includes(c.card))
    ? 'medium'
    : 'low';

  res.json({ spread: drawn, severity, timestamp: new Date().toISOString() });
});

// ── Crystal Ball ───────────────────────────────────────────────────────────
const VISIONS = [
  { vision: 'A figure stands at a crossroads, one path lit by moonlight, the other swallowed by shadow.', severity: 'medium' },
  { vision: 'Flames consume a structure you once called home. From the ashes, something stirs.', severity: 'high' },
  { vision: 'A door appears where no door existed. Behind it: silence.', severity: 'low' },
  { vision: 'Two hands reach toward each other across an impossible distance. They almost touch.', severity: 'low' },
  { vision: 'A clock with no hands. Time has stopped — or perhaps it never began.', severity: 'medium' },
  { vision: 'The sea rises. Not with water, but with voices of the forgotten.', severity: 'high' },
  { vision: 'A mirror reflects a room you have never entered, yet somehow know.', severity: 'medium' },
  { vision: 'Stars fall upward. The sky empties. Something watches from the void.', severity: 'high' },
  { vision: 'A child laughs in a garden that no longer exists. The laughter echoes forward.', severity: 'low' },
  { vision: 'Chains dissolve into smoke. What was bound is now free — for better or worse.', severity: 'medium' },
  { vision: 'A book opens to a page written in your handwriting, though you have no memory of writing it.', severity: 'medium' },
  { vision: 'The horizon bends. Distance collapses. What was far is suddenly here.', severity: 'low' },
];

const CLARITY_LEVELS = ['murky', 'hazy', 'clear', 'crystalline'];

router.get('/crystal-ball', (req, res) => {
  const vision = VISIONS[Math.floor(Math.random() * VISIONS.length)];
  const clarity = CLARITY_LEVELS[Math.floor(Math.random() * CLARITY_LEVELS.length)];
  const focus = req.query.focus?.toString().trim() || null;

  let interpretation = vision.vision;
  if (focus) {
    interpretation = `Regarding "${focus}": ${vision.vision}`;
  }

  res.json({
    vision: interpretation,
    clarity,
    severity: vision.severity,
    focus: focus || null,
    timestamp: new Date().toISOString(),
  });
});

// ── Rune Casting ───────────────────────────────────────────────────────────
const RUNES = [
  { name: 'Fehu', symbol: 'ᚠ', meaning: 'Wealth, abundance, success, fertility', reversed: 'Loss, greed, stagnation' },
  { name: 'Uruz', symbol: 'ᚢ', meaning: 'Strength, vitality, wild nature, primal power', reversed: 'Weakness, obsession, misdirected force' },
  { name: 'Thurisaz', symbol: 'ᚦ', meaning: 'Gateway, protection, reactive force', reversed: 'Danger, compulsion, betrayal' },
  { name: 'Ansuz', symbol: 'ᚨ', meaning: 'Signals, messages, divine inspiration', reversed: 'Miscommunication, manipulation, blocked' },
  { name: 'Raidho', symbol: 'ᚱ', meaning: 'Journey, quest, change, movement', reversed: 'Crisis, stagnation, journey blocked' },
  { name: 'Kenaz', symbol: 'ᚲ', meaning: 'Vision, revelation, knowledge, creativity', reversed: 'Disease, breakup, instability' },
  { name: 'Gebo', symbol: 'ᚷ', meaning: 'Partnership, gift, generosity, balance', reversed: null },
  { name: 'Wunjo', symbol: 'ᚹ', meaning: 'Joy, comfort, pleasure, fellowship', reversed: 'Sorrow, strife, alienation' },
  { name: 'Hagalaz', symbol: 'ᚺ', meaning: 'Disruption, hail, uncontrolled forces', reversed: null },
  { name: 'Nauthiz', symbol: 'ᚾ', meaning: 'Constraint, necessity, conflict', reversed: 'Constraint, necessity, conflict' },
  { name: 'Isa', symbol: 'ᛁ', meaning: 'Ice, standstill, introspection', reversed: null },
  { name: 'Jera', symbol: 'ᛃ', meaning: 'Harvest, reward, cycles, one year', reversed: null },
  { name: 'Eihwaz', symbol: 'ᛇ', meaning: 'Endurance, defense, protection, death and rebirth', reversed: null },
  { name: 'Perthro', symbol: 'ᛈ', meaning: 'Fate, mystery, chance, hidden things', reversed: 'Addiction, stagnation, loneliness' },
  { name: 'Algiz', symbol: 'ᛉ', meaning: 'Protection, defense, instinct, higher self', reversed: 'Hidden danger, consumption, loss' },
  { name: 'Sowilo', symbol: 'ᛊ', meaning: 'Sun, success, goals, honor', reversed: null },
  { name: 'Tiwaz', symbol: 'ᛏ', meaning: 'Justice, sacrifice, victory, honor', reversed: 'Injustice, imbalance, defeat' },
  { name: 'Berkano', symbol: 'ᛒ', meaning: 'Growth, rebirth, fertility, new beginnings', reversed: 'Family problems, anxiety, carelessness' },
  { name: 'Ehwaz', symbol: 'ᛖ', meaning: 'Movement, progress, partnership, trust', reversed: 'Restlessness, disharmony, recklessness' },
  { name: 'Mannaz', symbol: 'ᛗ', meaning: 'The self, humanity, collective, memory', reversed: 'Depression, manipulation, cunning' },
  { name: 'Laguz', symbol: 'ᛚ', meaning: 'Flow, water, intuition, the unconscious', reversed: 'Fear, confusion, avoidance' },
  { name: 'Ingwaz', symbol: 'ᛜ', meaning: 'Fertility, new beginnings, internal growth', reversed: null },
  { name: 'Dagaz', symbol: 'ᛞ', meaning: 'Breakthrough, transformation, hope, clarity', reversed: null },
  { name: 'Othala', symbol: 'ᛟ', meaning: 'Heritage, home, ancestry, inheritance', reversed: 'Lack of order, totalitarianism, slavery' },
];

router.get('/runes', (req, res) => {
  const count = Math.min(parseInt(req.query.count) || 3, 5);
  const shuffled = [...RUNES].sort(() => Math.random() - 0.5);
  const cast = shuffled.slice(0, count).map(rune => {
    const isReversed = rune.reversed !== null && Math.random() > 0.6;
    return {
      name: rune.name,
      symbol: rune.symbol,
      reversed: isReversed,
      meaning: isReversed && rune.reversed ? rune.reversed : rune.meaning,
    };
  });

  const darkRunes = ['Hagalaz', 'Nauthiz', 'Thurisaz', 'Isa'];
  const severity = cast.filter(r => darkRunes.includes(r.name)).length >= 2
    ? 'high'
    : cast.some(r => darkRunes.includes(r.name))
    ? 'medium'
    : 'low';

  res.json({ runes: cast, severity, timestamp: new Date().toISOString() });
});

module.exports = router;
