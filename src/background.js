/**
 * Background Service Worker – orchestrates all extension logic.
 *
 * Responsibilities:
 *  - Handles messages from popup & options pages
 *  - Manages Gmail OAuth via chrome.identity
 *  - Runs email organization (manual + auto via alarms)
 *  - Sends progress updates back to popup
 */

import { loadConfig } from "./config.js";
import {
  getAuthToken,
  removeCachedToken,
  getUserEmail,
  listInboxMessages,
  getMessage,
  getOrCreateLabel,
  modifyMessageLabels,
  listLabels,
} from "./gmail.js";
import {
  classifyEmail,
  setExistingLabels,
  getRateLimitDelay,
} from "./classifier.js";

// Sleep helper for rate limiting
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Cached state ─────────────────────────────────────────
let cachedToken = null;
let isRunning = false;

// ── Message router ───────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  handleMessage(msg)
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err.message }));
  return true; // keep sendResponse channel open for async
});

async function handleMessage(msg) {
  switch (msg.action) {
    case "getAuthStatus":
      return await getAuthStatus();
    case "signIn":
      return await signIn();
    case "signOut":
      return await signOut();
    case "organizeInbox":
      return await organizeInbox();
    case "setAutoOrganize":
      return await setAutoOrganize(msg.enabled);
    default:
      return { error: "Unknown action" };
  }
}

// ── Auth ──────────────────────────────────────────────────

async function getAuthStatus() {
  try {
    const token = await getAuthToken(false);
    cachedToken = token;
    const email = await getUserEmail(token);
    return { token: !!token, email };
  } catch {
    return { token: false, email: null };
  }
}

async function signIn() {
  try {
    const token = await getAuthToken(true);
    cachedToken = token;
    const email = await getUserEmail(token);
    return { success: true, email };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function signOut() {
  if (cachedToken) {
    await removeCachedToken(cachedToken);
    cachedToken = null;
  }
  return { success: true };
}

// ── Auto-organize alarm ──────────────────────────────────

async function setAutoOrganize(enabled) {
  if (enabled) {
    const config = await loadConfig();
    chrome.alarms.create("autoOrganize", {
      periodInMinutes: config.autoOrganizeIntervalMinutes || 30,
    });
  } else {
    chrome.alarms.clear("autoOrganize");
  }
  return { success: true };
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "autoOrganize") {
    const config = await loadConfig();
    if (config.autoOrganizeEnabled) {
      await organizeInbox();
    }
  }
});

// Restore alarm on extension startup if auto-organize was enabled
chrome.runtime.onStartup.addListener(async () => {
  const config = await loadConfig();
  if (config.autoOrganizeEnabled) {
    await setAutoOrganize(true);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const config = await loadConfig();
  if (config.autoOrganizeEnabled) {
    await setAutoOrganize(true);
  }
});

// ── Core: Organize Inbox ─────────────────────────────────

async function organizeInbox() {
  if (isRunning) return { success: false, error: "Already running" };
  isRunning = true;

  const stats = {
    processed: 0,
    categorized: 0,
    skipped: 0,
    failed: 0,
    categories: {},
  };

  try {
    // Ensure we have a token
    if (!cachedToken) {
      cachedToken = await getAuthToken(false);
    }
    const token = cachedToken;
    const config = await loadConfig();

    broadcast({ type: "log", text: "Fetching inbox messages…" });

    // Load existing labels so AI can reuse them
    const existingLabels = await listLabels(token);
    const labelNames = existingLabels.map((l) => l.name);
    setExistingLabels(labelNames);
    broadcast({
      type: "log",
      text: `Found ${labelNames.length} existing labels.`,
    });

    // Fetch messages
    const messages = await listInboxMessages(token, {
      maxResults: config.maxEmailsToProcess,
      unreadOnly: config.processOnlyUnread,
    });

    const total = messages.length;
    broadcast({ type: "log", text: `Found ${total} emails to process.` });

    if (total === 0) {
      broadcast({
        type: "log",
        text: "No new emails found.",
        level: "success",
      });
      isRunning = false;
      return { success: true, stats };
    }

    // Label cache to avoid repeated lookups
    const labelCache = {};

    for (let i = 0; i < total; i++) {
      try {
        // Progress
        broadcast({ type: "progress", current: i + 1, total });

        // Fetch full message
        const emailData = await getMessage(token, messages[i].id);
        broadcast({
          type: "log",
          text: `[${i + 1}/${total}] ${emailData.subject?.slice(0, 60) || "(no subject)"}`,
        });

        // Classify
        const classification = await classifyEmail(emailData);
        const { category, confidence, reasoning } = classification;

        broadcast({
          type: "log",
          text: `  → ${category || "Unknown"} (${(confidence * 100).toFixed(0)}%) – ${reasoning}`,
        });

        // Determine min confidence (AI is reliable, use lower threshold)
        const minConfidence = config.minConfidenceForAutoLabel || 0.7;

        if (category && confidence >= minConfidence) {
          // Get or create label
          if (!labelCache[category]) {
            labelCache[category] = await getOrCreateLabel(token, category);
          }

          const removeLabelIds = config.keepInInbox ? [] : ["INBOX"];
          await modifyMessageLabels(token, emailData.id, {
            addLabelIds: [labelCache[category]],
            removeLabelIds,
          });

          broadcast({
            type: "log",
            text: `  ✅ Labeled: ${category}`,
            level: "success",
          });
          stats.categorized++;
          stats.categories[category] = (stats.categories[category] || 0) + 1;
        } else if (category) {
          broadcast({
            type: "log",
            text: `  ⚠️ Low confidence (${(confidence * 100).toFixed(0)}%) – skipped`,
            level: "warn",
          });
          stats.skipped++;
        } else {
          stats.skipped++;
        }

        stats.processed++;

        // Rate limiting delay between API calls
        const delay = getRateLimitDelay(config.aiProvider || "gemini");
        if (i < total - 1) {
          await sleep(delay);
        }

        // Rate limiting
        if ((i + 1) % config.batchSize === 0) {
          await sleep(config.delayBetweenBatchesMs);
        }
      } catch (err) {
        console.error("Error processing email:", err);
        broadcast({
          type: "log",
          text: `  ❌ Error: ${err.message}`,
          level: "error",
        });
        stats.failed++;
      }
    }

    // Save stats for later display
    await chrome.storage.local.set({ lastRunStats: stats });

    // Send notification
    chrome.notifications.create("organizeComplete", {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon128.png"),
      title: "Mail Organizer",
      message: `Done! ${stats.categorized} of ${stats.processed} emails categorized.`,
    });

    broadcast({
      type: "log",
      text: `🎉 Complete! ${stats.categorized} categorized, ${stats.skipped} skipped, ${stats.failed} failed.`,
      level: "success",
    });

    isRunning = false;
    return { success: true, stats };
  } catch (err) {
    isRunning = false;
    console.error("organizeInbox error:", err);
    broadcast({
      type: "log",
      text: `Fatal error: ${err.message}`,
      level: "error",
    });
    return { success: false, error: err.message, stats };
  }
}

// ── Utilities ────────────────────────────────────────────

function broadcast(msg) {
  chrome.runtime.sendMessage(msg).catch(() => {
    // popup may not be open — ignore
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
