/**
 * Input validation middleware and utilities
 * Provides security validation for user inputs
 */

/**
 * Sanitize string input by removing potentially dangerous characters
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes, control characters, and trim whitespace
  return input
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

/**
 * Validate username input
 * @param {string} username - Username to validate
 * @returns {Object} Validation result
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return {
      valid: false,
      error: 'Username is required and must be a string'
    };
  }

  const sanitized = sanitizeString(username);
  
  if (sanitized.length === 0) {
    return {
      valid: false,
      error: 'Username cannot be empty'
    };
  }

  if (sanitized.length > 20) {
    return {
      valid: false,
      error: 'Username must be 20 characters or less'
    };
  }

  // Check for valid characters (alphanumeric, spaces, basic punctuation)
  if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(sanitized)) {
    return {
      valid: false,
      error: 'Username contains invalid characters'
    };
  }

  return {
    valid: true,
    sanitized
  };
}

/**
 * Validate message content
 * @param {string} message - Message content to validate
 * @returns {Object} Validation result
 */
function validateMessage(message) {
  if (!message || typeof message !== 'string') {
    return {
      valid: false,
      error: 'Message is required and must be a string'
    };
  }

  const sanitized = sanitizeString(message);
  
  if (sanitized.length === 0) {
    return {
      valid: false,
      error: 'Message cannot be empty'
    };
  }

  if (sanitized.length > 500) {
    return {
      valid: false,
      error: 'Message must be 500 characters or less'
    };
  }

  return {
    valid: true,
    sanitized
  };
}

/**
 * Validate city name input
 * @param {string} city - City name to validate
 * @returns {Object} Validation result
 */
function validateCity(city) {
  if (!city || typeof city !== 'string') {
    return {
      valid: false,
      error: 'City name is required and must be a string'
    };
  }

  const sanitized = sanitizeString(city);
  
  if (sanitized.length === 0) {
    return {
      valid: false,
      error: 'City name cannot be empty'
    };
  }

  if (sanitized.length > 50) {
    return {
      valid: false,
      error: 'City name must be 50 characters or less'
    };
  }

  // Allow letters, spaces, hyphens, apostrophes for international city names
  if (!/^[a-zA-Z\s\-'\.]+$/.test(sanitized)) {
    return {
      valid: false,
      error: 'City name contains invalid characters'
    };
  }

  return {
    valid: true,
    sanitized
  };
}

/**
 * Validate realm name
 * @param {string} realm - Realm name to validate
 * @returns {Object} Validation result
 */
function validateRealm(realm) {
  const validRealms = ['living', 'beyond', 'unknown'];
  
  if (!realm || typeof realm !== 'string') {
    return {
      valid: false,
      error: 'Realm is required and must be a string'
    };
  }

  const sanitized = sanitizeString(realm).toLowerCase();
  
  if (!validRealms.includes(sanitized)) {
    return {
      valid: false,
      error: 'Invalid realm. Must be one of: living, beyond, unknown'
    };
  }

  return {
    valid: true,
    sanitized
  };
}

/**
 * Express middleware for input validation
 * @param {Object} validationRules - Validation rules for request fields
 * @returns {Function} Express middleware function
 */
function createValidationMiddleware(validationRules) {
  return (req, res, next) => {
    const errors = [];
    
    // Validate body fields
    if (validationRules.body) {
      for (const [field, validator] of Object.entries(validationRules.body)) {
        const value = req.body[field];
        const result = validator(value);
        
        if (!result.valid) {
          errors.push(`${field}: ${result.error}`);
        } else if (result.sanitized !== undefined) {
          req.body[field] = result.sanitized;
        }
      }
    }
    
    // Validate query fields
    if (validationRules.query) {
      for (const [field, validator] of Object.entries(validationRules.query)) {
        const value = req.query[field];
        const result = validator(value);
        
        if (!result.valid) {
          errors.push(`${field}: ${result.error}`);
        } else if (result.sanitized !== undefined) {
          req.query[field] = result.sanitized;
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
}

module.exports = {
  sanitizeString,
  validateUsername,
  validateMessage,
  validateCity,
  validateRealm,
  createValidationMiddleware
};