/**
 * In-memory message storage for Shinigami-bin chat
 * Structured for easy database migration later
 */

class MessageStore {
  constructor() {
    // Map of realm -> array of messages
    this.messages = new Map();
    // Maximum messages to keep per realm (prevent memory overflow)
    this.maxMessagesPerRealm = 200; // Increased to 200 as requested
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

    // Keep only the most recent messages (memory safety)
    if (realmMessages.length > this.maxMessagesPerRealm) {
      const removedCount = realmMessages.length - this.maxMessagesPerRealm;
      realmMessages.splice(0, removedCount); // Remove oldest messages
      console.log(`🗑️ Removed ${removedCount} old messages from ${message.realm} (keeping ${this.maxMessagesPerRealm} most recent)`);
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
      maxMessagesPerRealm: this.maxMessagesPerRealm,
      totalMessages: 0,
      realms: {}
    };

    this.messages.forEach((messages, realm) => {
      stats.totalMessages += messages.length;
      stats.realms[realm] = {
        messageCount: messages.length,
        memoryUsage: `${messages.length}/${this.maxMessagesPerRealm}`,
        oldestMessage: messages.length > 0 ? messages[0].timestamp : null,
        newestMessage: messages.length > 0 ? messages[messages.length - 1].timestamp : null
      };
    });

    return stats;
  }

  /**
   * Get memory usage information
   * @returns {Object} Memory usage statistics
   */
  getMemoryUsage() {
    let totalMessages = 0;
    let totalMemoryEstimate = 0;
    
    this.messages.forEach((messages) => {
      totalMessages += messages.length;
      // Rough estimate: ~200 bytes per message
      totalMemoryEstimate += messages.length * 200;
    });

    return {
      totalMessages,
      maxCapacity: this.messages.size * this.maxMessagesPerRealm,
      utilizationPercent: Math.round((totalMessages / (this.messages.size * this.maxMessagesPerRealm || 1)) * 100),
      estimatedMemoryBytes: totalMemoryEstimate,
      estimatedMemoryMB: Math.round(totalMemoryEstimate / 1024 / 1024 * 100) / 100
    };
  }
}

// Export singleton instance
const messageStore = new MessageStore();
module.exports = messageStore;