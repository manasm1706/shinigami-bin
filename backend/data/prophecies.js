// In-memory prophecy storage

const prophecies = [
  {
    id: '1',
    title: 'Team Meeting',
    date: '2025-12-15T10:00:00.000Z',
    originalTitle: 'Team Meeting',
    ominousTitle: 'The Gathering of Souls in the Conference Chamber',
    ominousDescription: 'When the sun reaches its zenith, the chosen ones shall convene in the sacred chamber. Words will be spoken that cannot be unspoken, and decisions made that echo through eternity.',
    severity: 'medium',
    createdAt: new Date().toISOString()
  }
];

/**
 * Generate ominous prophecy text based on event title and date
 * Following the fortune-tone steering guidelines
 */
function generateOminousProphecy(title, date) {
  const eventDate = new Date(date);
  const dayOfWeek = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
  const timeOfDay = eventDate.getHours();
  
  // Time-based atmospheric descriptions
  const timeDescriptions = {
    dawn: 'as the veil between night and day grows thin',
    morning: 'when the sun reveals what darkness concealed',
    noon: 'as the sun reaches its merciless zenith',
    afternoon: 'while shadows begin their inevitable march',
    evening: 'as twilight beckons the spirits forth',
    night: 'when darkness reclaims its dominion',
    midnight: 'at the witching hour when all boundaries dissolve'
  };

  let timeDesc = 'when the appointed hour arrives';
  if (timeOfDay >= 5 && timeOfDay < 7) timeDesc = timeDescriptions.dawn;
  else if (timeOfDay >= 7 && timeOfDay < 11) timeDesc = timeDescriptions.morning;
  else if (timeOfDay >= 11 && timeOfDay < 13) timeDesc = timeDescriptions.noon;
  else if (timeOfDay >= 13 && timeOfDay < 17) timeDesc = timeDescriptions.afternoon;
  else if (timeOfDay >= 17 && timeOfDay < 20) timeDesc = timeDescriptions.evening;
  else if (timeOfDay >= 20 && timeOfDay < 24) timeDesc = timeDescriptions.night;
  else if (timeOfDay >= 0 && timeOfDay < 5) timeDesc = timeDescriptions.midnight;

  // Event type transformations (following steering tone guidelines)
  const eventTransformations = {
    'meeting': 'gathering of souls',
    'call': 'summoning across the void',
    'interview': 'trial of worthiness',
    'presentation': 'revelation of hidden truths',
    'deadline': 'moment of reckoning',
    'appointment': 'fated encounter',
    'lunch': 'communion of sustenance',
    'dinner': 'evening feast of mortals',
    'party': 'celebration before the inevitable',
    'birthday': 'marking another year closer to eternity',
    'anniversary': 'remembrance of what was',
    'vacation': 'temporary escape from destiny',
    'travel': 'journey into the unknown',
    'conference': 'conclave of the chosen',
    'workshop': 'ritual of learning',
    'training': 'preparation for trials ahead',
    'review': 'judgment of deeds past',
    'project': 'undertaking of great consequence'
  };

  // Transform title to ominous version
  let ominousTitle = title;
  for (const [key, value] of Object.entries(eventTransformations)) {
    if (title.toLowerCase().includes(key)) {
      ominousTitle = title.toLowerCase().replace(key, value);
      break;
    }
  }

  // If no transformation found, use generic mysterious phrasing
  if (ominousTitle === title) {
    ominousTitle = `The Ordained Event: ${title}`;
  }

  // Capitalize properly
  ominousTitle = ominousTitle.charAt(0).toUpperCase() + ominousTitle.slice(1);

  // Generate ominous descriptions with subtle humor and cryptic phrasing
  const descriptions = [
    `${timeDesc}, the threads of fate converge upon this moment. What appears mundane to mortal eyes carries weight beyond comprehension.`,
    `The cosmic calendar marks this hour with invisible ink. ${timeDesc}, destiny unfolds as it was always meant to.`,
    `${timeDesc}, the appointed gathering shall commence. The participants know not that they dance to music written before their birth.`,
    `When ${dayOfWeek}'s shadow falls upon the realm, ${timeDesc}, the foretold event materializes from the ether of possibility.`,
    `The shinigami's ledger notes this moment with particular interest. ${timeDesc}, mortals will gather, unaware of the significance their actions hold.`,
    `${timeDesc}, the veil lifts briefly to reveal what was always destined. Those present will speak words that echo through dimensions unseen.`,
    `The ancient prophecies whispered of this day. ${timeDesc}, the convergence begins, though its true purpose remains shrouded in mystery.`,
    `${timeDesc}, the cosmic machinery clicks into place. What seems like mere scheduling is actually the universe's way of maintaining balance.`
  ];

  const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];

  // Determine severity based on time and content
  let severity = 'low';
  if (title.toLowerCase().includes('deadline') || title.toLowerCase().includes('interview') || title.toLowerCase().includes('review')) {
    severity = 'high';
  } else if (title.toLowerCase().includes('meeting') || title.toLowerCase().includes('presentation') || title.toLowerCase().includes('call')) {
    severity = 'medium';
  }

  return {
    ominousTitle,
    ominousDescription: randomDescription,
    severity
  };
}

/**
 * Add a new prophecy
 */
function addProphecy(prophecyData) {
  const { title, date } = prophecyData;
  const ominousData = generateOminousProphecy(title, date);
  
  const newProphecy = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    title: title.trim(),
    date: new Date(date).toISOString(),
    originalTitle: title.trim(),
    ...ominousData,
    createdAt: new Date().toISOString()
  };

  prophecies.push(newProphecy);
  return newProphecy;
}

/**
 * Get all prophecies, sorted by date
 */
function getAllProphecies() {
  return prophecies.sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * Get prophecies by date range
 */
function getPropheciesByDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return prophecies.filter(prophecy => {
    const prophecyDate = new Date(prophecy.date);
    return prophecyDate >= start && prophecyDate <= end;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * Delete a prophecy
 */
function deleteProphecy(id) {
  const index = prophecies.findIndex(p => p.id === id);
  if (index !== -1) {
    return prophecies.splice(index, 1)[0];
  }
  return null;
}

/**
 * Clear all prophecies (for testing)
 */
function clearProphecies() {
  prophecies.length = 0;
}

module.exports = {
  prophecies,
  addProphecy,
  getAllProphecies,
  getPropheciesByDateRange,
  deleteProphecy,
  clearProphecies,
  generateOminousProphecy
};