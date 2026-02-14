/**
 * Gmail API wrapper – handles OAuth and all Gmail interactions
 * using Chrome Identity API + Gmail REST API.
 */

const GMAIL_BASE = "https://www.googleapis.com/gmail/v1/users/me";

/**
 * Get a valid OAuth2 access token via chrome.identity.
 * @param {boolean} interactive - show sign-in prompt if needed
 * @returns {Promise<string>} access token
 */
export async function getAuthToken(interactive = false) {
  return new Promise((resolve, reject) => {
    console.log("Requesting auth token, interactive:", interactive);
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        console.error("Auth token error:", chrome.runtime.lastError);
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        console.log("Auth token received successfully");
        resolve(token);
      }
    });
  });
}

/**
 * Remove the cached auth token (sign out).
 * @param {string} token
 */
export async function removeCachedToken(token) {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, resolve);
  });
}

/**
 * Get the user's email address from their Gmail profile.
 * @param {string} token
 * @returns {Promise<string>}
 */
export async function getUserEmail(token) {
  const res = await gmailFetch(token, "/profile");
  return res.emailAddress;
}

// ── Private fetch wrapper ────────────────────────────────

async function gmailFetch(token, path, options = {}) {
  const url = GMAIL_BASE + path;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail API ${res.status}: ${body}`);
  }

  return res.json();
}

// ── Labels ───────────────────────────────────────────────

/**
 * List all user labels.
 * @param {string} token
 * @returns {Promise<Array>}
 */
export async function listLabels(token) {
  const data = await gmailFetch(token, "/labels");
  return data.labels || [];
}

/**
 * Get or create a label by name. Returns the label ID.
 * @param {string} token
 * @param {string} labelName
 * @returns {Promise<string>} label ID
 */
export async function getOrCreateLabel(token, labelName) {
  const labels = await listLabels(token);
  const existing = labels.find(
    (l) => l.name.toLowerCase() === labelName.toLowerCase(),
  );
  if (existing) return existing.id;

  // Create new label
  const newLabel = await gmailFetch(token, "/labels", {
    method: "POST",
    body: JSON.stringify({
      name: labelName,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    }),
  });

  return newLabel.id;
}

// ── Messages ─────────────────────────────────────────────

/**
 * List inbox messages (IDs only).
 * @param {string} token
 * @param {object} opts
 * @param {number} opts.maxResults
 * @param {boolean} opts.unreadOnly
 * @returns {Promise<Array<{id: string, threadId: string}>>}
 */
export async function listInboxMessages(
  token,
  { maxResults = 100, unreadOnly = false } = {},
) {
  const messages = [];
  let pageToken = null;

  while (messages.length < maxResults) {
    const remaining = maxResults - messages.length;
    let query = `in:inbox`;
    if (unreadOnly) query += " is:unread";

    let url = `/messages?q=${encodeURIComponent(query)}&maxResults=${Math.min(100, remaining)}`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    const data = await gmailFetch(token, url);
    if (data.messages) messages.push(...data.messages);
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return messages.slice(0, maxResults);
}

/**
 * Get a single message with full metadata + plain-text body snippet.
 * @param {string} token
 * @param {string} messageId
 * @returns {Promise<object>} parsed email data
 */
export async function getMessage(token, messageId) {
  const msg = await gmailFetch(token, `/messages/${messageId}?format=full`);
  return parseMessage(msg);
}

/**
 * Modify a message's labels.
 * @param {string} token
 * @param {string} messageId
 * @param {object} labelMods
 * @param {string[]} labelMods.addLabelIds
 * @param {string[]} labelMods.removeLabelIds
 */
export async function modifyMessageLabels(
  token,
  messageId,
  { addLabelIds = [], removeLabelIds = [] },
) {
  await gmailFetch(token, `/messages/${messageId}/modify`, {
    method: "POST",
    body: JSON.stringify({ addLabelIds, removeLabelIds }),
  });
}

// ── Parse helpers ────────────────────────────────────────

function parseMessage(msg) {
  const headers = msg.payload?.headers || [];
  const getHeader = (name) =>
    (headers.find((h) => h.name.toLowerCase() === name.toLowerCase()) || {})
      .value || "";

  const subject = getHeader("Subject");
  const sender = getHeader("From");
  const date = getHeader("Date");
  const body = extractPlainText(msg.payload);
  const hasAttachments = checkAttachments(msg.payload);

  return {
    id: msg.id,
    threadId: msg.threadId,
    subject,
    sender,
    date,
    body,
    hasAttachments,
    snippet: msg.snippet || "",
    combinedText: (subject + " " + body).toLowerCase(),
  };
}

function extractPlainText(payload) {
  if (!payload) return "";

  // Single part
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Multipart — recurse
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractPlainText(part);
      if (text) return text;
    }
  }

  return "";
}

function checkAttachments(payload) {
  if (!payload) return false;
  if (
    payload.filename &&
    payload.filename.length > 0 &&
    payload.body?.attachmentId
  ) {
    return true;
  }
  if (payload.parts) {
    return payload.parts.some(checkAttachments);
  }
  return false;
}

function decodeBase64Url(data) {
  try {
    const decoded = atob(data.replace(/-/g, "+").replace(/_/g, "/"));
    return decoded;
  } catch {
    return "";
  }
}
