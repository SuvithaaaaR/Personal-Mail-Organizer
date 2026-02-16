/**
 * Options page script – loads/saves all extension settings.
 */

import { DEFAULT_CONFIG, loadConfig, saveConfig } from "../config.js";
import { DEFAULT_KEYWORDS, loadKeywords, saveKeywords } from "../keywords.js";
import { getClassifierStats } from "../localClassifier.js";

// ── DOM refs ──────────────────────────────────────────────
const fields = {
  aiProvider: document.getElementById("aiProvider"),
  aiApiKey: document.getElementById("aiApiKey"),
  aiModel: document.getElementById("aiModel"),
  useAiClassification: document.getElementById("useAiClassification"),
  aiConfidenceThreshold: document.getElementById("aiConfidenceThreshold"),
  minConfidenceForAutoLabel: document.getElementById(
    "minConfidenceForAutoLabel",
  ),
  fallbackToKeywords: document.getElementById("fallbackToKeywords"),
  maxEmailsToProcess: document.getElementById("maxEmailsToProcess"),
  processOnlyUnread: document.getElementById("processOnlyUnread"),
  keepInInbox: document.getElementById("keepInInbox"),
  autoOrganizeEnabled: document.getElementById("autoOrganizeEnabled"),
  autoOrganizeIntervalMinutes: document.getElementById(
    "autoOrganizeIntervalMinutes",
  ),
  batchSize: document.getElementById("batchSize"),
  delayBetweenBatchesMs: document.getElementById("delayBetweenBatchesMs"),
};

const apiKeyHelp = document.getElementById("apiKeyHelp");
const apiKeySection = document.getElementById("apiKeySection");
const modelSection = document.getElementById("modelSection");
const providerDescription = document.getElementById("providerDescription");
const localMLStats = document.getElementById("localMLStats");
const statsContent = document.getElementById("statsContent");
const thresholdValue = document.getElementById("thresholdValue");
const autoLabelValue = document.getElementById("autoLabelValue");

const keywordsEditor = document.getElementById("keywordsEditor");
const keywordsError = document.getElementById("keywordsError");

// Learned patterns elements
const learnedStatsContent = document.getElementById("learnedStatsContent");
const learnedDomains = document.getElementById("learnedDomains");
const learnedSenders = document.getElementById("learnedSenders");
const learnedPhrases = document.getElementById("learnedPhrases");
const btnClearLearned = document.getElementById("btnClearLearned");

const btnSave = document.getElementById("btnSave");
const btnReset = document.getElementById("btnReset");
const saveStatus = document.getElementById("saveStatus");

// ── Provider help links ───────────────────────────────────
const providerInfo = {
  local: {
    description:
      "Local ML runs entirely on your device - 100% private, no data sent anywhere!",
    showApiKey: false,
    showModel: false,
  },
  gemini: {
    description:
      'Get FREE key at <a href="https://aistudio.google.com/app/apikey" target="_blank">aistudio.google.com</a>',
    showApiKey: true,
    showModel: true,
  },
  groq: {
    description:
      'Get FREE key at <a href="https://console.groq.com/keys" target="_blank">console.groq.com</a>',
    showApiKey: true,
    showModel: true,
  },
  openai: {
    description:
      'Get key at <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a> (Paid)',
    showApiKey: true,
    showModel: true,
  },
};

function updateProviderHelp() {
  const provider = fields.aiProvider.value;
  const info = providerInfo[provider] || providerInfo.local;

  providerDescription.innerHTML = info.description;
  apiKeySection.style.display = info.showApiKey ? "block" : "none";
  modelSection.style.display = info.showModel ? "block" : "none";
  localMLStats.style.display = provider === "local" ? "block" : "none";

  if (info.showApiKey) {
    apiKeyHelp.innerHTML = info.description;
  }

  // Update local ML stats if showing
  if (provider === "local") {
    updateLocalMLStats();
  }
}

async function updateLocalMLStats() {
  try {
    const stats = await getClassifierStats();
    statsContent.textContent = `${stats.totalCategories} categories, ${stats.domainMappings} domains, ${stats.emailPatterns} patterns`;

    // Also update learned stats
    const learnedCount =
      (stats.learnedDomains || 0) +
      (stats.learnedSenderNames || 0) +
      (stats.learnedPhrases || 0);
    if (learnedStatsContent) {
      learnedStatsContent.textContent = `${stats.learnedDomains || 0} domains, ${stats.learnedSenderNames || 0} senders, ${stats.learnedPhrases || 0} phrases`;
    }
  } catch (e) {
    statsContent.textContent = "Stats unavailable";
  }
}

async function loadLearnedPatterns() {
  try {
    const result = await chrome.runtime.sendMessage({
      action: "getLearnedPatterns",
    });

    if (learnedDomains) {
      const domains = result.learnedDomains || {};
      if (Object.keys(domains).length > 0) {
        learnedDomains.textContent = Object.entries(domains)
          .map(([k, v]) => `${k} → ${v}`)
          .join("\n");
      } else {
        learnedDomains.textContent = "(none)";
      }
    }

    if (learnedSenders) {
      const senders = result.learnedSenderNames || {};
      if (Object.keys(senders).length > 0) {
        learnedSenders.textContent = Object.entries(senders)
          .map(([k, v]) => `${k} → ${v}`)
          .join("\n");
      } else {
        learnedSenders.textContent = "(none)";
      }
    }

    if (learnedPhrases) {
      const phrases = result.learnedSubjectPhrases || {};
      if (Object.keys(phrases).length > 0) {
        learnedPhrases.textContent = Object.entries(phrases)
          .map(([cat, arr]) => `${cat}: ${arr.join(", ")}`)
          .join("\n");
      } else {
        learnedPhrases.textContent = "(none)";
      }
    }
  } catch (e) {
    console.error("Failed to load learned patterns:", e);
  }
}

async function clearAllLearnedPatterns() {
  if (
    !confirm(
      "Clear all learned patterns? The classifier will forget all corrections.",
    )
  )
    return;

  try {
    await chrome.runtime.sendMessage({ action: "clearLearnedPatterns" });
    await loadLearnedPatterns();
    await updateLocalMLStats();
    saveStatus.textContent = "🗑️ Cleared!";
    saveStatus.classList.remove("hidden");
    setTimeout(() => {
      saveStatus.textContent = "✅ Saved!";
      saveStatus.classList.add("hidden");
    }, 2000);
  } catch (e) {
    console.error("Failed to clear learned patterns:", e);
  }
}

// ── Load settings ─────────────────────────────────────────
async function loadAll() {
  const config = await loadConfig();
  const keywords = await loadKeywords();

  // Populate fields
  fields.aiProvider.value = config.aiProvider || "local";
  fields.aiApiKey.value = config.aiApiKey || "";
  fields.aiModel.value = config.aiModel || "llama-3.1-8b-instant";
  fields.useAiClassification.checked = config.useAiClassification;
  fields.aiConfidenceThreshold.value = config.aiConfidenceThreshold;
  thresholdValue.textContent = config.aiConfidenceThreshold.toFixed(2);
  fields.minConfidenceForAutoLabel.value = config.minConfidenceForAutoLabel;
  autoLabelValue.textContent = config.minConfidenceForAutoLabel.toFixed(2);
  fields.fallbackToKeywords.checked = config.fallbackToKeywords;
  fields.maxEmailsToProcess.value = config.maxEmailsToProcess;
  fields.processOnlyUnread.checked = config.processOnlyUnread;
  fields.keepInInbox.checked = config.keepInInbox;
  fields.autoOrganizeEnabled.checked = config.autoOrganizeEnabled;
  fields.autoOrganizeIntervalMinutes.value = config.autoOrganizeIntervalMinutes;
  fields.batchSize.value = config.batchSize;
  fields.delayBetweenBatchesMs.value = config.delayBetweenBatchesMs;

  // Keywords
  keywordsEditor.value = JSON.stringify(keywords, null, 2);

  updateProviderHelp();
}

// ── Save settings ─────────────────────────────────────────
async function saveAll() {
  // Validate keywords JSON
  let keywords;
  try {
    keywords = JSON.parse(keywordsEditor.value);
    keywordsError.classList.add("hidden");
  } catch (e) {
    keywordsError.textContent = "Invalid JSON: " + e.message;
    keywordsError.classList.remove("hidden");
    return;
  }

  const configUpdates = {
    aiProvider: fields.aiProvider.value,
    aiApiKey: fields.aiApiKey.value.trim(),
    aiModel: fields.aiModel.value,
    useAiClassification: fields.useAiClassification.checked,
    aiConfidenceThreshold: parseFloat(fields.aiConfidenceThreshold.value),
    minConfidenceForAutoLabel: parseFloat(
      fields.minConfidenceForAutoLabel.value,
    ),
    fallbackToKeywords: fields.fallbackToKeywords.checked,
    maxEmailsToProcess: parseInt(fields.maxEmailsToProcess.value, 10),
    processOnlyUnread: fields.processOnlyUnread.checked,
    keepInInbox: fields.keepInInbox.checked,
    autoOrganizeEnabled: fields.autoOrganizeEnabled.checked,
    autoOrganizeIntervalMinutes: parseInt(
      fields.autoOrganizeIntervalMinutes.value,
      10,
    ),
    batchSize: parseInt(fields.batchSize.value, 10),
    delayBetweenBatchesMs: parseInt(fields.delayBetweenBatchesMs.value, 10),
  };

  await saveConfig(configUpdates);
  await saveKeywords(keywords);

  // Notify background about auto-organize change
  chrome.runtime.sendMessage({
    action: "setAutoOrganize",
    enabled: configUpdates.autoOrganizeEnabled,
  });

  // Flash success
  saveStatus.classList.remove("hidden");
  setTimeout(() => saveStatus.classList.add("hidden"), 2000);
}

// ── Reset to defaults ─────────────────────────────────────
async function resetAll() {
  if (!confirm("Reset all settings to defaults? This cannot be undone."))
    return;

  await saveConfig(DEFAULT_CONFIG);
  await saveKeywords(DEFAULT_KEYWORDS);
  await loadAll();

  saveStatus.textContent = "🔄 Reset!";
  saveStatus.classList.remove("hidden");
  setTimeout(() => {
    saveStatus.textContent = "✅ Saved!";
    saveStatus.classList.add("hidden");
  }, 2000);
}

// ── Event listeners ───────────────────────────────────────
btnSave.addEventListener("click", saveAll);
btnReset.addEventListener("click", resetAll);

if (btnClearLearned) {
  btnClearLearned.addEventListener("click", clearAllLearnedPatterns);
}

fields.aiProvider.addEventListener("change", updateProviderHelp);

fields.aiConfidenceThreshold.addEventListener("input", () => {
  thresholdValue.textContent = parseFloat(
    fields.aiConfidenceThreshold.value,
  ).toFixed(2);
});

fields.minConfidenceForAutoLabel.addEventListener("input", () => {
  autoLabelValue.textContent = parseFloat(
    fields.minConfidenceForAutoLabel.value,
  ).toFixed(2);
});

// ── Init ──────────────────────────────────────────────────
loadAll();
loadLearnedPatterns();
