/**
 * Popup script – UI controller for the extension popup.
 * Communicates with the background service worker via chrome.runtime messages.
 */

import { loadConfig, saveConfig } from "../config.js";

// ── DOM refs ──────────────────────────────────────────────
const authSection = document.getElementById("authSection");
const mainSection = document.getElementById("mainSection");
const btnSignIn = document.getElementById("btnSignIn");
const btnSignOut = document.getElementById("btnSignOut");
const userEmail = document.getElementById("userEmail");
const btnOrganize = document.getElementById("btnOrganize");
const btnRestore = document.getElementById("btnRestore");
const autoOrganizeToggle = document.getElementById("autoOrganizeToggle");

const statusBadge = document.getElementById("statusBadge");
const progressArea = document.getElementById("progressArea");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");

const statsArea = document.getElementById("statsArea");
const statProcessed = document.getElementById("statProcessed");
const statCategorized = document.getElementById("statCategorized");
const statSkipped = document.getElementById("statSkipped");
const statFailed = document.getElementById("statFailed");
const categoryBreakdown = document.getElementById("categoryBreakdown");

const logArea = document.getElementById("logArea");
const btnOptions = document.getElementById("btnOptions");

// ── Helpers ───────────────────────────────────────────────
function setStatus(text, className = "") {
  statusBadge.textContent = text;
  statusBadge.className = "badge " + className;
}

function addLog(message, type = "") {
  const entry = document.createElement("div");
  entry.className = "log-entry " + type;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logArea.prepend(entry);
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
      const row = document.createElement("div");
      row.className = "cat-row";
      row.innerHTML = `<span class="cat-name">${cat}</span><span class="cat-count">${count}</span>`;
      categoryBreakdown.appendChild(row);
    }
  }
}

// ── Auth ──────────────────────────────────────────────────
async function checkAuth() {
  const { token, email } = await sendMessage({ action: "getAuthStatus" });
  if (token) {
    authSection.classList.add("hidden");
    mainSection.classList.remove("hidden");
    userEmail.textContent = email || "Signed in";
  } else {
    authSection.classList.remove("hidden");
    mainSection.classList.add("hidden");
  }
}

btnSignIn.addEventListener("click", async () => {
  btnSignIn.disabled = true;
  btnSignIn.textContent = "Signing in…";
  try {
    const response = await sendMessage({ action: "signIn" });

    // Check for error from message handler
    if (response.error) {
      addLog("Sign-in failed: " + response.error, "error");
      alert("Sign-in failed: " + response.error);
      return;
    }

    const { success, email, error } = response;
    if (success) {
      authSection.classList.add("hidden");
      mainSection.classList.remove("hidden");
      userEmail.textContent = email || "Signed in";
      addLog("Successfully signed in as " + email, "success");
    } else {
      const errorMsg = error || "Unknown error occurred";
      addLog("Sign-in failed: " + errorMsg, "error");
      alert("Sign-in failed: " + errorMsg);
    }
  } catch (err) {
    addLog("Sign-in failed: " + err.message, "error");
    alert("Sign-in failed: " + err.message);
  } finally {
    btnSignIn.disabled = false;
    btnSignIn.textContent = "Sign in with Google";
  }
});

btnSignOut.addEventListener("click", async () => {
  await sendMessage({ action: "signOut" });
  mainSection.classList.add("hidden");
  authSection.classList.remove("hidden");
  setStatus("Idle");
});

// ── Organize ─────────────────────────────────────────────
btnOrganize.addEventListener("click", async () => {
  btnOrganize.disabled = true;
  progressArea.classList.remove("hidden");
  statsArea.classList.add("hidden");
  setStatus("Running", "running");
  progressFill.style.width = "0%";
  progressText.textContent = "Starting…";
  addLog("Starting email organization…");

  try {
    const result = await sendMessage({ action: "organizeInbox" });
    if (result.success) {
      setStatus("Done", "done");
      addLog(
        `Finished! ${result.stats.categorized} emails categorized.`,
        "success",
      );
      showStats(result.stats);
    } else {
      setStatus("Error", "error");
      addLog(
        "Organization failed: " + (result.error || "Unknown error"),
        "error",
      );
    }
  } catch (err) {
    setStatus("Error", "error");
    addLog("Error: " + err.message, "error");
  } finally {
    btnOrganize.disabled = false;
    progressArea.classList.add("hidden");
  }
});

// ── Restore to Inbox ─────────────────────────────────────
btnRestore.addEventListener("click", async () => {
  if (
    !confirm(
      "This will move ALL emails (not in inbox) back to your inbox. Continue?",
    )
  ) {
    return;
  }

  btnRestore.disabled = true;
  btnRestore.textContent = "Restoring...";
  setStatus("Restoring", "running");
  addLog("Starting restore to inbox...");

  try {
    const result = await sendMessage({ action: "restoreToInbox" });

    if (result.success) {
      setStatus("Done", "done");
      addLog(`✅ Restored ${result.restored} emails to inbox!`, "success");
    } else {
      setStatus("Error", "error");
      addLog("Restore failed: " + (result.error || "Unknown error"), "error");
    }
  } catch (err) {
    setStatus("Error", "error");
    addLog("Error: " + err.message, "error");
  } finally {
    btnRestore.disabled = false;
    btnRestore.textContent = "📥 Restore All to Inbox";
  }
});

// ── Auto-organize toggle ─────────────────────────────────
autoOrganizeToggle.addEventListener("change", async () => {
  const enabled = autoOrganizeToggle.checked;
  await saveConfig({ autoOrganizeEnabled: enabled });
  await sendMessage({ action: "setAutoOrganize", enabled });
  addLog(`Auto-organize ${enabled ? "enabled" : "disabled"}`);
});

// ── Options link ─────────────────────────────────────────
btnOptions.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// ── Listen for progress updates from background ──────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "progress") {
    const pct = Math.round((msg.current / msg.total) * 100);
    progressFill.style.width = pct + "%";
    progressText.textContent = `Processing ${msg.current} / ${msg.total}…`;
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
  const config = await loadConfig();
  autoOrganizeToggle.checked = config.autoOrganizeEnabled;

  // Load last-run stats from storage
  chrome.storage.local.get("lastRunStats", ({ lastRunStats }) => {
    if (lastRunStats) showStats(lastRunStats);
  });

  await checkAuth();
})();
