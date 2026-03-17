/**
 * Realm configuration — defines behavior metadata for each realm.
 * Realms are treated as default system conversations.
 */

const REALM_CONFIGS = {
  living: {
    id: 'living',
    name: 'Living',
    type: 'social',
    effectsLevel: 'low',
    allowRituals: false,
    description: 'The realm of mortals and everyday existence'
  },
  beyond: {
    id: 'beyond',
    name: 'Beyond',
    type: 'experimental',
    effectsLevel: 'high',
    allowRituals: true,
    description: 'Where spirits dwell and fortunes are told'
  },
  unknown: {
    id: 'unknown',
    name: 'Unknown',
    type: 'system',
    effectsLevel: 'medium',
    allowRituals: false,
    description: 'The mysterious void between worlds'
  }
};

/**
 * Get config for a realm by id
 * @param {string} realmId
 * @returns {object|null}
 */
function getRealmConfig(realmId) {
  return REALM_CONFIGS[realmId] || null;
}

/**
 * Get all realm configs
 * @returns {object[]}
 */
function getAllRealmConfigs() {
  return Object.values(REALM_CONFIGS);
}

module.exports = { REALM_CONFIGS, getRealmConfig, getAllRealmConfigs };
