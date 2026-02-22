import type { RitualDefinition, RitualResult } from '../RitualRegistry';

// Fate outcomes with their probabilities and types
const fateOutcomes = [
  { text: "Fortune smiles upon your path", severity: "blessing", weight: 15 },
  { text: "The spirits whisper of opportunity", severity: "blessing", weight: 15 },
  { text: "Ancient wisdom guides your steps", severity: "blessing", weight: 10 },
  { text: "The void watches with interest", severity: "neutral", weight: 20 },
  { text: "Shadows dance around your future", severity: "neutral", weight: 20 },
  { text: "The ethereal plane remains silent", severity: "neutral", weight: 15 },
  { text: "Beware the choices that lie ahead", severity: "curse", weight: 10 },
  { text: "Dark omens cloud your horizon", severity: "curse", weight: 8 },
  { text: "The spirits speak of trials to come", severity: "curse", weight: 7 }
];

function selectWeightedOutcome() {
  const totalWeight = fateOutcomes.reduce((sum, outcome) => sum + outcome.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const outcome of fateOutcomes) {
    random -= outcome.weight;
    if (random <= 0) {
      return outcome;
    }
  }
  
  // Fallback to neutral outcome
  return fateOutcomes[4];
}

export const wheelOfFateRitual: RitualDefinition = {
  id: 'wheel_of_fate',
  name: 'Wheel of Fate',
  description: 'Spin the cosmic wheel to reveal your destiny',
  category: 'fate',
  cooldown: 45000, // 45 seconds
  
  async execute(): Promise<RitualResult> {
    // Simulate spinning time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const outcome = selectWeightedOutcome();
    
    return {
      id: `fate_${Date.now()}`,
      type: 'wheel_of_fate',
      success: true,
      data: {
        outcome: outcome.text,
        severity: outcome.severity,
        spinDuration: 2000,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
  }
};