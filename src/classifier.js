/**
 * Email Classifier – Smart email categorization
 * Supports: Local ML (FREE, no API), Google Gemini, OpenAI, Groq
 */

import { loadConfig } from "./config.js";
import { classifyEmailLocally } from "./localClassifier.js";

// API Endpoints (for optional cloud AI)
const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Cache for existing labels to help AI reuse them
let existingLabelsCache = [];

// Rate limiting: delay between API calls (ms)
const RATE_LIMIT_DELAYS = {
  gemini: 4500, // ~13 requests/min (limit is 15)
  groq: 2200, // ~27 requests/min (limit is 30)
  openai: 500, // Paid tier, fast
};

/** Sleep helper */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Retry with exponential backoff for rate limits */
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);

    if (res.status === 429 && attempt < maxRetries) {
      // Extract retry delay from response or use exponential backoff
      const retryAfter = res.headers.get("Retry-After");
      const delayMs = retryAfter
        ? parseInt(retryAfter) * 1000
        : Math.pow(2, attempt + 1) * 1000;
      console.log(`Rate limited, retrying in ${delayMs}ms...`);
      await sleep(delayMs);
      continue;
    }

    return res;
  }
}

/** Get rate limit delay for provider */
export function getRateLimitDelay(provider) {
  if (provider === "local") return 50; // Local ML is fast!
  return RATE_LIMIT_DELAYS[provider] || 2000;
}

/**
 * Set the existing Gmail labels so AI can reuse them when appropriate.
 * @param {string[]} labels
 */
export function setExistingLabels(labels) {
  existingLabelsCache = labels.filter(
    (l) =>
      ![
        "INBOX",
        "SENT",
        "DRAFT",
        "SPAM",
        "TRASH",
        "STARRED",
        "IMPORTANT",
        "UNREAD",
      ].includes(l),
  );
}

/**
 * Classify an email using local ML or cloud AI.
 * @param {object} emailData - { subject, body, sender, hasAttachments, snippet }
 * @returns {Promise<{ category: string|null, confidence: number, reasoning: string, alternativeCategories: string[] }>}
 */
export async function classifyEmail(emailData) {
  const config = await loadConfig();
  const provider = config.aiProvider || "local";

  try {
    // Local ML classification (default, no API key needed)
    if (provider === "local") {
      return await classifyEmailLocally(emailData);
    }

    // Cloud AI requires API key
    if (!config.aiApiKey) {
      console.log("No API key, falling back to local ML");
      return await classifyEmailLocally(emailData);
    }

    if (provider === "gemini") {
      return await classifyWithGemini(emailData, config);
    } else if (provider === "groq") {
      return await classifyWithGroq(emailData, config);
    } else if (provider === "openai") {
      return await classifyWithOpenAI(emailData, config);
    } else {
      return await classifyEmailLocally(emailData);
    }
  } catch (err) {
    console.error("Classification failed, trying local ML:", err);
    // Fallback to local ML on any error
    return await classifyEmailLocally(emailData);
  }
}

// ── Build the classification prompt ──────────────────────

function buildPrompt(emailData) {
  const bodyPreview = (emailData.body || emailData.snippet || "").slice(
    0,
    1500,
  );
  const senderMatch = emailData.sender?.match(/@([^\s>]+)/);
  const senderDomain = senderMatch ? senderMatch[1] : "";

  const existingLabelsStr =
    existingLabelsCache.length > 0
      ? `\n\nExisting labels in user's Gmail (prefer reusing these if they fit well):\n${existingLabelsCache.join(", ")}`
      : "";

  return `You are an intelligent email organizer. Analyze this email and assign the BEST label.

GUIDELINES:
- Be Specific: Use labels like "Job Applications", "Online Courses", "Hackathons", "Finance" etc.
- Recognize sources: LeetCode→"Coding Practice", IEEE→"Academic/Research", NPTEL→"Online Courses"
- Use Title Case for labels (2-3 words max)
- Be confident if the classification is clear

EMAIL:
FROM: ${emailData.sender}
DOMAIN: ${senderDomain}
SUBJECT: ${emailData.subject}
BODY: ${bodyPreview}
${existingLabelsStr}

Respond with ONLY valid JSON:
{"category": "Label Name", "confidence": 0.95, "reasoning": "Brief reason", "alternative_categories": ["Other1"]}`;
}

// ── Google Gemini (FREE) ─────────────────────────────────

async function classifyWithGemini(emailData, config) {
  const prompt = buildPrompt(emailData);
  const model = config.aiModel || "gemini-2.0-flash";
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${config.aiApiKey}`;

  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 400,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const parsed = JSON.parse(text);

  if (parsed.category && !existingLabelsCache.includes(parsed.category)) {
    existingLabelsCache.push(parsed.category);
  }

  return {
    category: parsed.category || null,
    confidence: parsed.confidence || 0.8,
    reasoning: parsed.reasoning || "",
    alternativeCategories: parsed.alternative_categories || [],
  };
}

// ── Groq (FREE) ──────────────────────────────────────────

async function classifyWithGroq(emailData, config) {
  const prompt = buildPrompt(emailData);
  const model = config.aiModel || "llama-3.1-8b-instant";

  const res = await fetchWithRetry(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.aiApiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 400,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Groq API ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);

  if (parsed.category && !existingLabelsCache.includes(parsed.category)) {
    existingLabelsCache.push(parsed.category);
  }

  return {
    category: parsed.category || null,
    confidence: parsed.confidence || 0.8,
    reasoning: parsed.reasoning || "",
    alternativeCategories: parsed.alternative_categories || [],
  };
}

// ── OpenAI (Paid) ────────────────────────────────────────

async function classifyWithOpenAI(emailData, config) {
  const prompt = buildPrompt(emailData);

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.aiApiKey}`,
    },
    body: JSON.stringify({
      model: config.aiModel || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 400,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`OpenAI API ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);

  if (parsed.category && !existingLabelsCache.includes(parsed.category)) {
    existingLabelsCache.push(parsed.category);
  }

  return {
    category: parsed.category || null,
    confidence: parsed.confidence || 0.8,
    reasoning: parsed.reasoning || "",
    alternativeCategories: parsed.alternative_categories || [],
  };
}
