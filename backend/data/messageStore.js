/**
 * In-memory message storage for Shinigami-bin chat
 * Structured for easy database migration later
 */

class MessageStore {
  constructor() {
    // Map of realm -> array of messages
    this.messages = new Map();
    // Maximum messages to keep per realm (prevent memory overflow)
    this.maxMessagesPerRealm = 100;
  }

  /**
   * Add a message to a realm
   * @param {Object} message - Message object
   * @param {string} message.id - Unique message ID
   * @param {string} message.sender - Username of sender
   * @param {string} message.text - Message content
   * @param {string} message.realm - Realm ID
   * @param {string} message.timestamp - ISO timestamp
   */
  addMessage(message) {
    if (!this.messages.has(message.realm)) {
      this.messages.set(message.realm, []);
    }

    const realmMessages = this.messages.get(message.realm);
    realmMessages.push(message);

    // Keep only the most recent messages
    if (realmMessages.length > this.maxMessagesPerRealm) {
      realmMessages.shift(); // Remove oldest message
    }

    console.log(`📝 Stored message in ${message.realm}: ${message.sender}: ${message.text}`);
    return message;
  }

  /**
   * Get recent messages for a realm
   * @param {string} realm - Realm ID
   * @param {number} limit - Maximum number of messages to return (default: 50)
   * @returns {Array} Array of message objects
   */
  getRecentMessages(realm, limit = 50) {
    if (!this.messages.has(realm)) {
      return [];
    }

    const realmMessages = this.messages.get(realm);
    // Return the most recent messages up to the limit
    return realmMessages.slice(-limit);
  }

  /**
   * Get all messages for a realm (for admin/debug purposes)
   * @param {string} realm - Realm ID
   * @returns {Array} Array of all message objects
   */
  getAllMessages(realm) {
    return this.messages.get(realm) || [];
  }

  /**
   * Clear messages for a realm
   * @param {string} realm - Realm ID
   */
  clearRealm(realm) {
    this.messages.delete(realm);
    console.log(`🧹 Cleared messages for realm: ${realm}`);
  }

  /**
   * Clear all messages (for testing/reset)
   */
  clearAll() {
    this.messages.clear();
    console.log('🧹 Cleared all messages from all realms');
  }

  /**
   * Get statistics about stored messages
   * @returns {Object} Statistics object
   */
  getStats() {
    const stats = {
      totalRealms: this.messages.size,
      realms: {}
    };

    this.messages.forEach((messages, realm) => {
      stats.realms[realm] = {
        messageCount: messages.length,
        oldestMessage: messages.length > 0 ? messages[0].timestamp : null,
        newestMessage: messages.length > 0 ? messages[messages.length - 1].timestamp : null
      };
    });

    return stats;
  }
}

// Export singleton instance
const messageStore = new MessageStore();
module.exports = messageStore;