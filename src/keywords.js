/**
 * Default keyword categories for fallback classification.
 * These are used when AI classification is disabled or has low confidence.
 * Users can customise these via the Options page (stored in chrome.storage.local).
 */

export const DEFAULT_KEYWORDS = {
  Leetcode: [
    "leetcode",
    "daily challenge",
    "coding challenge",
    "weekly contest",
    "biweekly contest",
    "leetcode premium",
    "problem of the day",
  ],
  IEEE: [
    "ieee",
    "ieee xplore",
    "ieee spectrum",
    "ieee conference",
    "ieee paper",
    "ieee transactions",
    "ieee access",
    "ieee membership",
  ],
  NPTEL: [
    "nptel",
    "swayam",
    "iit madras",
    "iit bombay",
    "iit kharagpur",
    "iit kanpur",
    "iit delhi",
    "week content",
    "assignment",
    "noc",
  ],
  Meetings: [
    "meeting",
    "zoom",
    "google meet",
    "teams",
    "webex",
    "conference call",
    "scheduled",
    "calendar invite",
    "appointment",
    "catch up",
    "sync up",
    "standup",
    "1:1",
    "one-on-one",
    "discussion",
    "video call",
    "call scheduled",
  ],
  "Job Alerts": [
    "job",
    "hiring",
    "career",
    "opening",
    "position",
    "vacancy",
    "recruitment",
    "opportunity",
    "apply now",
    "job posting",
    "we're hiring",
    "join our team",
    "employment",
    "job opportunity",
    "career opportunity",
    "now hiring",
  ],
  Internships: [
    "internship",
    "trainee",
    "intern",
    "summer intern",
    "co-op",
    "placement",
    "student program",
    "graduate program",
    "apprentice",
    "internship opportunity",
    "intern position",
    "seeking interns",
  ],
  Exams: [
    "exam",
    "test",
    "assessment",
    "quiz",
    "midterm",
    "final",
    "examination",
    "test schedule",
    "exam schedule",
    "proctored",
    "online test",
    "evaluation",
    "coursework",
    "assignment due",
    "deadline",
    "submission",
  ],
  Promotions: [
    "sale",
    "discount",
    "offer",
    "deal",
    "promo",
    "coupon",
    "% off",
    "special offer",
    "limited time",
    "clearance",
    "free shipping",
    "save now",
    "exclusive offer",
    "flash sale",
  ],
  "Social Media": [
    "facebook",
    "twitter",
    "linkedin",
    "instagram",
    "notification",
    "mentioned you",
    "tagged you",
    "liked your",
    "commented on",
    "followed you",
    "connection request",
    "friend request",
  ],
  Newsletters: [
    "newsletter",
    "digest",
    "weekly roundup",
    "monthly update",
    "subscription",
    "unsubscribe",
    "mailing list",
    "bulletin",
    "press release",
  ],
  "Bills & Finance": [
    "invoice",
    "bill",
    "payment",
    "receipt",
    "statement",
    "due date",
    "overdue",
    "transaction",
    "balance",
    "payment reminder",
    "subscription renewal",
    "charge",
  ],
};

/**
 * Load keywords from chrome.storage.local, falling back to defaults.
 * @returns {Promise<object>}
 */
export async function loadKeywords() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ keywords: DEFAULT_KEYWORDS }, (items) => {
      resolve(items.keywords);
    });
  });
}

/**
 * Save keywords to chrome.storage.local.
 * @param {object} keywords
 * @returns {Promise<void>}
 */
export async function saveKeywords(keywords) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ keywords }, resolve);
  });
}
