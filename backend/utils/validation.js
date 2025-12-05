const { VALID_REALMS } = require('../data/store');

/**
 * Validate message fields
 * @param {Object} message - Message object to validate
 * @param {string} message.sender - Sender name
 * @param {string} message.text - Message text content
 * @param {string} message.realm - Realm identifier
 * @returns {Object} Validation result with valid flag and errors array
 */
function validateMessage({ sender, text, realm }) {
  const errors = [];

  // Validate sender
  if (!sender) {
    errors.push('Sender is required');
  } else if (typeof sender !== 'string') {
    errors.push('Sender must be a string');
  } else if (sender.trim().length === 0) {
    errors.push('Sender cannot be empty');
  } else if (sender.trim().length > 50) {
    errors.push('Sender name must be 50 characters or less');
  }

  // Validate text
  if (!text) {
    errors.push('Text is required');
  } else if (typeof text !== 'string') {
    errors.push('Text must be a string');
  } else if (text.trim().length === 0) {
    errors.push('Text cannot be empty');
  } else if (text.trim().length > 1000) {
    errors.push('Text must be 1000 characters or less');
  }

  // Validate realm
  if (!realm) {
    errors.push('Realm is required');
  } else if (typeof realm !== 'string') {
    errors.push('Realm must be a string');
  } else if (!VALID_REALMS.includes(realm.toLowerCase())) {
    errors.push(`Realm must be one of: ${VALID_REALMS.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize message text to prevent XSS
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate realm query parameter
 * @param {string} realm - Realm to validate
 * @returns {Object} Validation result
 */
function validateRealm(realm) {
  if (!realm) {
    return {
      valid: false,
      error: 'Realm parameter is required'
    };
  }

  if (!VALID_REALMS.includes(realm.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid realm. Must be one of: ${VALID_REALMS.join(', ')}`
    };
  }

  return { valid: true };
}

module.exports = {
  validateMessage,
  sanitizeText,
  validateRealm
};
