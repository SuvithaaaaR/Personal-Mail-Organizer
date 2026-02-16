/**
 * Default configuration for Personal Mail Organizer
 * Settings are stored in chrome.storage.sync and can be changed via the Options page.
 */

export const DEFAULT_CONFIG = {
  // AI Provider Settings
  aiProvider: "local", // Options: local (FREE, no API), groq (FREE), gemini (FREE), openai (paid)
  aiApiKey: "",
  aiModel: "", // Only needed for cloud AI

  // Classification Settings
  useAiClassification: true,
  aiConfidenceThreshold: 0.6,
  fallbackToKeywords: false,

  // Email Processing Settings
  maxEmailsToProcess: 30,
  processOnlyUnread: false,
  keepInInbox: true,

  // Auto-organize
  autoOrganizeEnabled: false,
  autoOrganizeIntervalMinutes: 30,

  // Confidence
  minConfidenceForAutoLabel: 0.7, // AI is smart, 70% is reliable

  // Rate Limiting
  batchSize: 10,
  delayBetweenBatchesMs: 1000,
};

/**
 * Load config from chrome.storage.sync, falling back to defaults.
 * @returns {Promise<object>}
 */
export async function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_CONFIG, (items) => {
      resolve(items);
    });
  });
}

/**
 * Save config values to chrome.storage.sync.
 * @param {object} updates - key/value pairs to save
 * @returns {Promise<void>}
 */
export async function saveConfig(updates) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(updates, resolve);
  });
}
