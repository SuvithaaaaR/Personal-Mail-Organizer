/**
 * Options page script – loads/saves all extension settings.
 */

import { DEFAULT_CONFIG, loadConfig, saveConfig } from "../config.js";
import { DEFAULT_KEYWORDS, loadKeywords, saveKeywords } from "../keywords.js";

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
const thresholdValue = document.getElementById("thresholdValue");
const autoLabelValue = document.getElementById("autoLabelValue");

const keywordsEditor = document.getElementById("keywordsEditor");
const keywordsError = document.getElementById("keywordsError");

const btnSave = document.getElementById("btnSave");
const btnReset = document.getElementById("btnReset");
const saveStatus = document.getElementById("saveStatus");

// ── Provider help links ───────────────────────────────────
const providerLinks = {
  gemini:
    'Get FREE key at <a href="https://aistudio.google.com/app/apikey" target="_blank">aistudio.google.com</a>',
  groq: 'Get FREE key at <a href="https://console.groq.com/keys" target="_blank">console.groq.com</a>',
  openai:
    'Get key at <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a> (Paid)',
};

function updateProviderHelp() {
  const provider = fields.aiProvider.value;
  apiKeyHelp.innerHTML = providerLinks[provider] || "";
}

// ── Load settings ─────────────────────────────────────────
async function loadAll() {
  const config = await loadConfig();
  const keywords = await loadKeywords();

  // Populate fields
  fields.aiProvider.value = config.aiProvider || "groq";
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
