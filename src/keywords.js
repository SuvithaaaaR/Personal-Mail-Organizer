/**
 * Default keyword categories for fallback classification.
 * These are used when AI classification is disabled or has low confidence.
 * Users can customise these via the Options page (stored in chrome.storage.local).
 */

export const DEFAULT_KEYWORDS = {
  Leetcode: [
    "leetcode",
    "leetcode.com",
    "daily challenge",
    "weekly contest",
    "biweekly contest",
    "leetcode premium",
    "problem of the day",
  ],
  "Coding Practice": [
    "hackerrank challenge",
    "codechef contest",
    "codeforces round",
    "geeksforgeeks",
    "competitive programming",
  ],
  IEEE: [
    "ieee xplore",
    "ieee spectrum",
    "ieee conference",
    "ieee paper",
    "ieee transactions",
    "ieee membership",
  ],
  NPTEL: [
    "nptel",
    "swayam",
    "noc certificate",
    "nptel course",
    "swayam course",
    "week content released",
  ],
  "Online Courses": [
    "coursera course",
    "udemy course",
    "course completion",
    "certificate of completion",
    "enrolled in course",
  ],
  ChatGPT: [
    "chatgpt",
    "openai",
    "gpt-4",
    "dall-e",
    "write faster with chatgpt",
    "chatgpt images",
    "chatgpt plus",
  ],
  Discord: [
    "discord",
    "verify email address for discord",
    "discord server",
    "discord notification",
    "join server",
  ],
  "College Events": [
    "techno cultural",
    "national level",
    "college fest",
    "annual fest",
    "cultural fest",
    "technical fest",
    "utsav",
    "symposium",
    "workshop registration",
    "event registration",
    "unstop",
    "dare2compete",
  ],
  Hackathons: [
    "hackathon",
    "devfolio",
    "hackon",
    "code jam",
    "build challenge",
    "24 hour",
    "48 hour",
  ],
  Meetings: [
    "zoom meeting",
    "google meet invitation",
    "microsoft teams meeting",
    "join meeting",
    "meeting scheduled for",
    "calendar invite",
  ],
  "Job Alerts": [
    "job opening",
    "we're hiring",
    "now hiring",
    "job alert",
    "career opportunity",
    "apply for this job",
  ],
  Internships: [
    "internship opportunity",
    "intern position",
    "summer internship",
    "winter internship",
    "internship program",
  ],
  Internshala: [
    "internshala",
    "you have been shortlisted",
    "new internship matching",
    "resume viewed by",
    "application status update",
  ],
  GitHub: [
    "pull request opened",
    "pull request merged",
    "issue opened",
    "issue closed",
    "pushed new commits",
    "github actions",
    "dependabot alert",
    "[github]",
  ],
  LinkedIn: [
    "linkedin notification",
    "connection request",
    "profile was viewed",
    "linkedin job",
    "endorsed you for",
  ],
  Exams: [
    "exam schedule",
    "examination hall",
    "midterm exam",
    "final exam",
    "exam result",
    "admit card",
    "hall ticket",
  ],
  Promotions: [
    "% off",
    "discount code",
    "special offer",
    "limited time offer",
    "flash sale",
    "promo code",
    "save up to",
  ],
  "Social Media": [
    "facebook notification",
    "twitter notification",
    "instagram notification",
    "mentioned you in",
    "tagged you in",
    "liked your post",
  ],
  Newsletters: [
    "newsletter",
    "weekly digest",
    "monthly roundup",
    "unsubscribe from",
  ],
  "Bills & Finance": [
    "invoice attached",
    "payment due",
    "bill statement",
    "bank statement",
    "transaction alert",
    "payment received",
  ],
  Shopping: [
    "order confirmed",
    "order shipped",
    "out for delivery",
    "track your order",
    "shipping update",
  ],
  "Food & Delivery": [
    "food delivery",
    "your order is on the way",
    "order arriving",
    "delivery partner",
  ],
  Google: [
    "google account",
    "security alert from google",
    "sign-in attempt",
    "google drive shared",
    "account was recovered",
  ],
  OTP: [
    "verification code is",
    "one time password",
    "your otp is",
    "authentication code",
    "security code is",
  ],
  "Health & Wellness": [
    "self-care",
    "wellness tips",
    "meditation",
    "mindfulness",
    "health tips",
    "fitness goals",
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
