// In-memory data store for messages

const messages = [
  {
    id: '1',
    sender: 'SYSTEM',
    text: 'Welcome to the Living realm. Your journey begins here...',
    realm: 'living',
    timestamp: new Date().toISOString()
  },
  {
    id: '2',
    sender: 'SYSTEM',
    text: 'The Beyond awaits those who seek answers from the other side...',
    realm: 'beyond',
    timestamp: new Date().toISOString()
  },
  {
    id: '3',
    sender: 'SYSTEM',
    text: 'In the Unknown, mysteries unfold and destinies are written...',
    realm: 'unknown',
    timestamp: new Date().toISOString()
  }
];

// Valid realms
const VALID_REALMS = ['living', 'beyond', 'unknown'];

/**
 * Add a new message to the store
 * @param {Object} message - Message object with id, sender, text, realm, timestamp
 * @returns {Object} The added message
 */
function addMessage(message) {
  messages.push(message);
  return message;
}

/**
 * Get messages filtered by realm
 * @param {string} realm - The realm to filter by
 * @returns {Array} Array of messages for the specified realm
 */
function getMessagesByRealm(realm) {
  const normalizedRealm = realm.toLowerCase();
  return messages.filter(msg => msg.realm === normalizedRealm);
}

/**
 * Get all messages
 * @returns {Array} All messages
 */
function getAllMessages() {
  return messages;
}

/**
 * Clear all messages (useful for testing)
 */
function clearMessages() {
  messages.length = 0;
}

module.exports = {
  messages,
  VALID_REALMS,
  addMessage,
  getMessagesByRealm,
  getAllMessages,
  clearMessages
};
