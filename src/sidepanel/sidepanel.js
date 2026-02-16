/**
 * Side Panel script – UI controller for the extension side panel.
 * Communicates with the background service worker via chrome.runtime messages.
 */

import { loadConfig, saveConfig, DEFAULT_CONFIG } from "../config.js";

// ── DOM refs: Main ────────────────────────────────────────
const authSection = document.getElementById("authSection");
const mainSection = document.getElementById("mainSection");
const settingsSection = document.getElementById("settingsSection");
const btnSignIn = document.getElementById("btnSignIn");
const btnSignOut = document.getElementById("btnSignOut");
const userEmail = document.getElementById("userEmail");
const btnOrganize = document.getElementById("btnOrganize");
const btnRestore = document.getElementById("btnRestore");
const btnSettings = document.getElementById("btnSettings");
const btnBack = document.getElementById("btnBack");
const headerTitle = document.getElementById("headerTitle");
const autoOrganizeToggle = document.getElementById("autoOrganizeToggle");

const progressArea = document.getElementById("progressArea");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const btnCancel = document.getElementById("btnCancel");

const statsArea = document.getElementById("statsArea");
const statProcessed = document.getElementById("statProcessed");
const statCategorized = document.getElementById("statCategorized");
const statSkipped = document.getElementById("statSkipped");
const statFailed = document.getElementById("statFailed");
const categoryBreakdown = document.getElementById("categoryBreakdown");
const logArea = document.getElementById("logArea");

// ── DOM refs: Settings ────────────────────────────────────
const aiProvider = document.getElementById("aiProvider");
const apiKeySection = document.getElementById("apiKeySection");
const aiApiKey = document.getElementById("aiApiKey");
const useAiClassification = document.getElementById("useAiClassification");
const maxEmailsToProcess = document.getElementById("maxEmailsToProcess");
const processOnlyUnread = document.getElementById("processOnlyUnread");
const keepInInbox = document.getElementById("keepInInbox");
const autoOrganizeEnabled = document.getElementById("autoOrganizeEnabled");
const autoOrganizeIntervalMinutes = document.getElementById(
  "autoOrganizeIntervalMinutes",
);
const batchSize = document.getElementById("batchSize");
const delayBetweenBatchesMs = document.getElementById("delayBetweenBatchesMs");
const btnSaveSettings = document.getElementById("btnSaveSettings");
const btnResetSettings = document.getElementById("btnResetSettings");
const btnClearLearned = document.getElementById("btnClearLearned");
const learnedStatsContent = document.getElementById("learnedStatsContent");
const saveStatus = document.getElementById("saveStatus");

// ── Helpers ───────────────────────────────────────────────
function setStatus(text, className = "") {
  // Status badge removed from UI
}

function addLog(message, type = "") {
  const entry = document.createElement("div");
  entry.className = "log-entry " + type;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logArea.prepend(entry);

  while (logArea.children.length > 50) {
    logArea.removeChild(logArea.lastChild);
  }
}

function showStats(stats) {
  statsArea.classList.remove("hidden");
  statProcessed.textContent = stats.processed;
  statCategorized.textContent = stats.categorized;
  statSkipped.textContent = stats.skipped || 0;
  statFailed.textContent = stats.failed;

  categoryBreakdown.innerHTML = "";
  if (stats.categories) {
    const sorted = Object.entries(stats.categories).sort((a, b) => b[1] - a[1]);
    for (const [cat, count] of sorted) {
      const tag = document.createElement("span");
      tag.className = "category-tag";
      tag.innerHTML = `${cat} <span class="count">${count}</span>`;
      categoryBreakdown.appendChild(tag);
    }
  }
}

// ── View Navigation ───────────────────────────────────────
function showMainView() {
  mainSection.classList.remove("hidden");
  settingsSection.classList.add("hidden");
  btnBack.classList.add("hidden");
  headerTitle.textContent = "Mail Organizer";
}

function showSettingsView() {
  mainSection.classList.add("hidden");
  settingsSection.classList.remove("hidden");
  btnBack.classList.remove("hidden");
  headerTitle.textContent = "Settings";
  loadSettingsForm();
  loadLearnedPatterns();
}

btnBack.addEventListener("click", showMainView);

// ── Auth ──────────────────────────────────────────────────
async function checkAuth() {
  const { token, email } = await sendMessage({ action: "getAuthStatus" });
  if (token) {
    authSection.classList.add("hidden");
    mainSection.classList.remove("hidden");
    userEmail.textContent = email || "Signed in";
    setStatus("Ready", "active");
  } else {
    authSection.classList.remove("hidden");
    mainSection.classList.add("hidden");
    setStatus("Not signed in");
  }
}

btnSignIn.addEventListener("click", async () => {
  btnSignIn.disabled = true;
  btnSignIn.textContent = "Signing in...";
  setStatus("Signing in...", "processing");

  try {
    const response = await sendMessage({ action: "signIn" });

    if (response.error) {
      addLog("Sign-in failed: " + response.error, "error");
      setStatus("Error");
      return;
    }

    const { success, email, error } = response;
    if (success) {
      authSection.classList.add("hidden");
      mainSection.classList.remove("hidden");
      userEmail.textContent = email || "Signed in";
      setStatus("Ready", "active");
      addLog("Signed in as " + email, "success");
    } else {
      const errorMsg = error || "Unknown error occurred";
      addLog("Sign-in failed: " + errorMsg, "error");
      setStatus("Error");
    }
  } catch (err) {
    addLog("Sign-in failed: " + err.message, "error");
    setStatus("Error");
  } finally {
    btnSignIn.disabled = false;
    btnSignIn.textContent = "Sign in with Google";
  }
});

btnSignOut.addEventListener("click", async () => {
  await sendMessage({ action: "signOut" });
  mainSection.classList.add("hidden");
  authSection.classList.remove("hidden");
  setStatus("Not signed in");
  addLog("Signed out");
});

// ── Organize ─────────────────────────────────────────────
btnOrganize.addEventListener("click", async () => {
  btnOrganize.disabled = true;
  btnOrganize.style.opacity = "0.6";
  progressArea.classList.remove("hidden");
  statsArea.classList.add("hidden");
  setStatus("Running", "processing");
  progressFill.style.width = "0%";
  progressText.textContent = "Starting...";
  addLog("Starting email organization...");

  try {
    const result = await sendMessage({ action: "organizeInbox" });
    if (result.success) {
      setStatus("Ready", "active");
      addLog(
        `Done. ${result.stats.categorized} emails categorized.`,
        "success",
      );
      showStats(result.stats);
    } else {
      setStatus("Error");
      addLog(
        "Organization failed: " + (result.error || "Unknown error"),
        "error",
      );
    }
  } catch (err) {
    setStatus("Error");
    addLog("Error: " + err.message, "error");
  } finally {
    btnOrganize.disabled = false;
    btnOrganize.style.opacity = "1";
    progressArea.classList.add("hidden");
  }
});

// ── Cancel Organization ─────────────────────────────────
btnCancel.addEventListener("click", async () => {
  btnCancel.disabled = true;
  btnCancel.textContent = "Cancelling...";
  addLog("Cancelling organization...");

  try {
    await sendMessage({ action: "cancelOrganize" });
  } catch (err) {
    addLog("Error cancelling: " + err.message, "error");
  } finally {
    btnCancel.disabled = false;
    btnCancel.textContent = "Cancel";
  }
});

// ── Restore to Inbox ─────────────────────────────────────
btnRestore.addEventListener("click", async () => {
  if (!confirm("Move ALL emails back to your inbox. Continue?")) {
    return;
  }

  btnRestore.disabled = true;
  btnRestore.style.opacity = "0.6";
  setStatus("Restoring", "processing");
  addLog("Starting restore to inbox...");

  try {
    const result = await sendMessage({ action: "restoreToInbox" });

    if (result.success) {
      setStatus("Ready", "active");
      addLog(`Restored ${result.restored} emails to inbox.`, "success");
    } else {
      setStatus("Error");
      addLog("Restore failed: " + (result.error || "Unknown error"), "error");
    }
  } catch (err) {
    setStatus("Error");
    addLog("Error: " + err.message, "error");
  } finally {
    btnRestore.disabled = false;
    btnRestore.style.opacity = "1";
  }
});

// ── Settings Button ──────────────────────────────────────
btnSettings.addEventListener("click", showSettingsView);

// ── Auto-organize toggle (main view) ─────────────────────
autoOrganizeToggle.addEventListener("change", async () => {
  const enabled = autoOrganizeToggle.checked;
  await saveConfig({ autoOrganizeEnabled: enabled });
  await sendMessage({ action: "setAutoOrganize", enabled });
  addLog(`Auto-organize ${enabled ? "enabled" : "disabled"}`);
});

// ── Settings Form ────────────────────────────────────────
async function loadSettingsForm() {
  const config = await loadConfig();

  aiProvider.value = config.aiProvider;
  aiApiKey.value = config.aiApiKey || "";
  useAiClassification.checked = config.useAiClassification;
  maxEmailsToProcess.value = config.maxEmailsToProcess;
  processOnlyUnread.checked = config.processOnlyUnread;
  keepInInbox.checked = config.keepInInbox;
  autoOrganizeEnabled.checked = config.autoOrganizeEnabled;
  autoOrganizeIntervalMinutes.value = config.autoOrganizeIntervalMinutes;
  batchSize.value = config.batchSize;
  delayBetweenBatchesMs.value = config.delayBetweenBatchesMs;

  updateApiKeyVisibility();
}

function updateApiKeyVisibility() {
  const provider = aiProvider.value;
  if (provider === "local") {
    apiKeySection.classList.add("hidden");
  } else {
    apiKeySection.classList.remove("hidden");
  }
}

aiProvider.addEventListener("change", updateApiKeyVisibility);

btnSaveSettings.addEventListener("click", async () => {
  const updates = {
    aiProvider: aiProvider.value,
    aiApiKey: aiApiKey.value,
    useAiClassification: useAiClassification.checked,
    maxEmailsToProcess: parseInt(maxEmailsToProcess.value, 10),
    processOnlyUnread: processOnlyUnread.checked,
    keepInInbox: keepInInbox.checked,
    autoOrganizeEnabled: autoOrganizeEnabled.checked,
    autoOrganizeIntervalMinutes: parseInt(
      autoOrganizeIntervalMinutes.value,
      10,
    ),
    batchSize: parseInt(batchSize.value, 10),
    delayBetweenBatchesMs: parseInt(delayBetweenBatchesMs.value, 10),
  };

  await saveConfig(updates);

  // Update auto-organize alarm
  await sendMessage({
    action: "setAutoOrganize",
    enabled: updates.autoOrganizeEnabled,
  });

  // Update main view toggle
  autoOrganizeToggle.checked = updates.autoOrganizeEnabled;

  // Show saved status
  saveStatus.classList.remove("hidden");
  setTimeout(() => saveStatus.classList.add("hidden"), 2000);

  addLog("Settings saved");
});

btnResetSettings.addEventListener("click", async () => {
  if (!confirm("Reset all settings to defaults?")) return;

  await saveConfig(DEFAULT_CONFIG);
  await loadSettingsForm();
  addLog("Settings reset to defaults");
});

// ── Learned Patterns ─────────────────────────────────────
async function loadLearnedPatterns() {
  try {
    const result = await sendMessage({ action: "getLearnedPatterns" });
    if (result && result.patterns) {
      const p = result.patterns;
      const domainCount = Object.keys(p.domains || {}).length;
      const senderCount = Object.keys(p.senderNames || {}).length;
      const phraseCount = Object.keys(p.subjectPhrases || {}).length;
      const total = domainCount + senderCount + phraseCount;

      learnedStatsContent.textContent = `${total} patterns (${domainCount} domains, ${senderCount} senders, ${phraseCount} phrases)`;
    } else {
      learnedStatsContent.textContent = "No patterns learned yet";
    }
  } catch (err) {
    learnedStatsContent.textContent = "Error loading patterns";
  }
}

btnClearLearned.addEventListener("click", async () => {
  if (!confirm("Clear all learned patterns? This cannot be undone.")) return;

  try {
    await sendMessage({ action: "clearLearnedPatterns" });
    learnedStatsContent.textContent = "All patterns cleared";
    addLog("Learned patterns cleared");
  } catch (err) {
    addLog("Error clearing patterns: " + err.message, "error");
  }
});

// ── Listen for progress updates from background ──────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "progress") {
    const pct = Math.round((msg.current / msg.total) * 100);
    progressFill.style.width = pct + "%";
    progressText.textContent = `Processing ${msg.current} / ${msg.total}...`;
  }
  if (msg.type === "log") {
    addLog(msg.text, msg.level || "");
  }
});

// ── Message helper ───────────────────────────────────────
function sendMessage(msg) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// ── Init ─────────────────────────────────────────────────
(async () => {
  logArea.innerHTML = '<div class="log-empty">No recent activity</div>';

  const config = await loadConfig();
  autoOrganizeToggle.checked = config.autoOrganizeEnabled;

  chrome.storage.local.get("lastRunStats", ({ lastRunStats }) => {
    if (lastRunStats) showStats(lastRunStats);
  });

  await checkAuth();
  addLog("Side panel ready");
})();
