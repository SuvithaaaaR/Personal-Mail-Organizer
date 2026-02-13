/**
 * Default configuration for Personal Mail Organizer
 * Settings are stored in chrome.storage.sync and can be changed via the Options page.
 */

export const DEFAULT_CONFIG = {
  // AI Provider Settings
  aiProvider: "groq", // Options: groq (FREE, best), gemini (FREE), openai (paid)
  aiApiKey: "",
  aiModel: "llama-3.1-8b-instant", // or gemini-2.0-flash, gpt-4o-mini

  // Classification Settings
  useAiClassification: true,
  aiConfidenceThreshold: 0.6,
  fallbackToKeywords: false,

  // Email Processing Settings
  maxEmailsToProcess: 30,
  processOnlyUnread: false,
  keepInInbox: false,

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
