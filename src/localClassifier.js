/**
 * Smart Local Email Classifier – Uses Real Email Patterns
 *
 * NO API KEYS NEEDED - 100% Local Classification
 *
 * Uses multiple signals:
 * 1. Domain matching (most reliable)
 * 2. REAL email template patterns (extracted from actual emails)
 * 3. Subject line analysis
 * 4. Body content patterns
 */

import { loadKeywords } from "./keywords.js";

// ══════════════════════════════════════════════════════════════════════════════
// DOMAIN TO CATEGORY MAPPING - First line of defense
// ══════════════════════════════════════════════════════════════════════════════
const DOMAIN_MAPPINGS = {
  // Coding Platforms
  leetcode: "Leetcode",
  hackerrank: "Coding Practice",
  codechef: "Coding Practice",
  codeforces: "Coding Practice",
  geeksforgeeks: "Coding Practice",
  interviewbit: "Coding Practice",
  topcoder: "Coding Practice",
  atcoder: "Coding Practice",
  exercism: "Coding Practice",
  codewars: "Coding Practice",

  // AI Services
  openai: "ChatGPT",
  chatgpt: "ChatGPT",
  anthropic: "AI Services",
  claude: "AI Services",
  bard: "AI Services",
  gemini: "AI Services",
  midjourney: "AI Services",
  stability: "AI Services",
  huggingface: "AI Services",
  perplexity: "AI Services",

  // Chat & Communication
  discord: "Discord",
  discordapp: "Discord",
  slack: "Slack",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  signal: "Messaging",
  viber: "Messaging",
  "teams.microsoft": "Microsoft Teams",

  // Learning Platforms
  nptel: "NPTEL",
  swayam: "NPTEL",
  coursera: "Online Courses",
  udemy: "Online Courses",
  edx: "Online Courses",
  skillshare: "Online Courses",
  pluralsight: "Online Courses",
  udacity: "Online Courses",
  khanacademy: "Online Courses",
  codecademy: "Online Courses",
  datacamp: "Online Courses",
  brillant: "Online Courses",

  // Jobs & Internships
  internshala: "Internshala",
  naukri: "Job Alerts",
  indeed: "Job Alerts",
  glassdoor: "Job Alerts",
  monster: "Job Alerts",
  ziprecruiter: "Job Alerts",
  dice: "Job Alerts",
  simplyhired: "Job Alerts",
  wellfound: "Job Alerts",
  "angel.co": "Job Alerts",
  hired: "Job Alerts",
  triplebyte: "Job Alerts",
  turing: "Job Alerts",
  toptal: "Job Alerts",
  remoteok: "Job Alerts",
  weworkremotely: "Job Alerts",

  // College Events & Hackathons
  unstop: "College Events",
  dare2compete: "College Events",
  devfolio: "Hackathons",
  hackerearth: "Hackathons",
  mlh: "Hackathons",
  hackclub: "Hackathons",
  eventbrite: "Events",
  meetup: "Events",
  luma: "Events",

  // Developer Tools
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Version Control",
  stackoverflow: "Stack Overflow",
  stackexchange: "Stack Overflow",
  docker: "DevOps",
  digitalocean: "Cloud",
  "aws.amazon": "AWS",
  azure: "Azure",
  heroku: "Cloud",
  vercel: "Cloud",
  netlify: "Cloud",
  railway: "Cloud",
  render: "Cloud",
  firebase: "Firebase",

  // Professional Networks
  linkedin: "LinkedIn",

  // Academic
  ieee: "IEEE",
  acm: "Academic",
  springer: "Academic",
  researchgate: "Academic",
  "academia.edu": "Academic",
  arxiv: "Academic",
  sciencedirect: "Academic",
  "scholar.google": "Academic",

  // Social Media
  facebook: "Social Media",
  facebookmail: "Social Media",
  instagram: "Social Media",
  twitter: "Social Media",
  "x.com": "Social Media",
  tiktok: "Social Media",
  pinterest: "Social Media",
  reddit: "Reddit",
  quora: "Quora",
  medium: "Medium",
  substack: "Newsletters",
  beehiiv: "Newsletters",
  buttondown: "Newsletters",
  hashnode: "Newsletters",
  devto: "Newsletters",

  // Shopping & E-commerce
  amazon: "Shopping",
  flipkart: "Shopping",
  myntra: "Shopping",
  ajio: "Shopping",
  snapdeal: "Shopping",
  meesho: "Shopping",
  nykaa: "Shopping",
  alibaba: "Shopping",
  aliexpress: "Shopping",
  ebay: "Shopping",

  // Food Delivery
  swiggy: "Food Delivery",
  zomato: "Food Delivery",
  dominos: "Food Delivery",
  mcdonalds: "Food Delivery",
  ubereats: "Food Delivery",
  doordash: "Food Delivery",

  // Travel
  uber: "Travel",
  ola: "Travel",
  rapido: "Travel",
  makemytrip: "Travel",
  goibibo: "Travel",
  booking: "Travel",
  airbnb: "Travel",
  cleartrip: "Travel",
  irctc: "Travel",

  // Finance
  paypal: "Finance",
  razorpay: "Finance",
  paytm: "Finance",
  phonepe: "Finance",
  gpay: "Finance",
  stripe: "Finance",
  wise: "Finance",
  revolut: "Finance",
  cred: "Finance",
  icici: "Finance",
  hdfc: "Finance",
  sbi: "Finance",
  axis: "Finance",
  kotak: "Finance",

  // Gaming
  steam: "Gaming",
  epicgames: "Gaming",
  playstation: "Gaming",
  xbox: "Gaming",
  twitch: "Gaming",
  riotgames: "Gaming",
  "ea.com": "Gaming",

  // Health & Wellness
  practo: "Health",
  healthifyme: "Health",
  "cult.fit": "Health",
  headspace: "Wellness",
  calm: "Wellness",
  fitbit: "Health",
  strava: "Health",

  // Google Services
  google: "Google",
  youtube: "YouTube",
  "accounts.google": "Google",

  // Microsoft
  microsoft: "Microsoft",
  outlook: "Microsoft",
  office365: "Microsoft",
};

// ══════════════════════════════════════════════════════════════════════════════
// REAL EMAIL PATTERNS - Actual phrases from real emails
// ══════════════════════════════════════════════════════════════════════════════
const EMAIL_PATTERNS = {
  // ─── ChatGPT / OpenAI ────────────────────────────────────
  ChatGPT: {
    subjects: [
      "chatgpt",
      "gpt-4",
      "dalle",
      "dall-e",
      "openai",
      "write faster with chatgpt",
      "you + chatgpt",
      "chatgpt images",
      "chatgpt plus",
      "new in chatgpt",
      "openai api",
      "your free chatgpt",
      "hope you cleared your afternoon",
      "introducing",
      "new feature",
      "sora",
      "try this prompt",
      "meet your new",
      "ai can now",
    ],
    body: [
      "chatgpt can now",
      "try chatgpt",
      "openai team",
      "gpt-4",
      "dall-e",
      "chatgpt plus",
      "openai.com",
      "we've made improvements",
      "new feature in chatgpt",
      "ai assistant",
      "language model",
      "try it now",
      "the openai team",
    ],
    sender: [
      "openai",
      "chatgpt",
      "noreply@tm.openai",
      "noreply@email.openai",
      "tm.openai",
    ],
  },

  // ─── Discord ─────────────────────────────────────────────
  Discord: {
    subjects: [
      "verify email address for discord",
      "verify your email for discord",
      "discord verification",
      "you've been invited to join",
      "new login to your discord",
      "discord nitro",
      "server invite",
      "mentioned you",
      "direct message from",
      "friend request from",
    ],
    body: [
      "welcome to discord",
      "verify email for discord",
      "join the server",
      "discord.com/verify",
      "discord server",
      "discord nitro",
      "discord.gg/",
      "discord app",
      "your discord account",
      "click here to verify",
    ],
    sender: ["discord", "noreply@discord"],
  },

  // ─── GitHub ──────────────────────────────────────────────
  GitHub: {
    subjects: [
      "[github]",
      "re: [github]",
      "pull request",
      "pr #",
      "issue #",
      "issue opened",
      "issue closed",
      "pushed to",
      "dependabot alert",
      "security alert",
      "github actions",
      "workflow run",
      "review requested",
      "approved your pull request",
      "merged pull request",
      "new release",
      "starred your repository",
      "forked your repository",
      "mentioned you on",
      "assigned to you",
    ],
    body: [
      "view on github",
      "view it on github",
      "github.com/",
      "pull request #",
      "issue #",
      "pushed new commits",
      "ci passed",
      "ci failed",
      "build passed",
      "build failed",
      "dependabot will",
      "github actions workflow",
      "unsubscribe from this thread",
      "you are receiving this because",
      "mute this conversation",
      "reply to this email directly",
      "merge pull request",
      "closed the issue",
      "requested your review",
    ],
    sender: ["github", "noreply@github", "notifications@github"],
  },

  // ─── LinkedIn ────────────────────────────────────────────
  LinkedIn: {
    subjects: [
      "new connection",
      "connection request",
      "accepted your invitation",
      "viewed your profile",
      "appeared in",
      "job alert:",
      "is hiring",
      "congratulations on",
      "endorsed you",
      "mentioned you",
      "commented on",
      "posted a job",
      "shared a post",
      "invitation to connect",
      "who viewed your profile",
      "your network",
      "jobs you may be interested in",
    ],
    body: [
      "linkedin.com/in/",
      "linkedin.com/jobs/",
      "linkedin.com/company/",
      "view profile",
      "connect with",
      "mutual connections",
      "apply on linkedin",
      "see all jobs",
      "unsubscribe from",
      "you received this email",
      "linkedin corporation",
      "degree connection",
      "people you may know",
    ],
    sender: ["linkedin", "messages-noreply@linkedin", "jobs-noreply@linkedin"],
  },

  // ─── Internshala ─────────────────────────────────────────
  Internshala: {
    subjects: [
      "you have been shortlisted",
      "shortlisted for",
      "new internship matching",
      "internshala",
      "resume viewed",
      "application status",
      "virtual interview",
      "new internships for you",
      "internship opportunity",
      "your application for",
      "interview scheduled",
      "training certificate",
    ],
    body: [
      "internshala.com",
      "apply now on internshala",
      "employer has shortlisted",
      "your internshala profile",
      "resume was viewed by",
      "stipend:",
      "stipend ₹",
      "work from home",
      "duration:",
      "apply by",
      "application deadline",
      "interview details",
    ],
    sender: ["internshala", "noreply@internshala", "no-reply@internshala"],
  },

  // ─── College Events ──────────────────────────────────────
  "College Events": {
    subjects: [
      "techno cultural",
      "technical fest",
      "cultural fest",
      "fest registration",
      "college fest",
      "annual fest",
      "symposium",
      "workshop registration",
      "event registration",
      "utsav",
      "national level",
      "inter college",
      "intra college",
      "invitation to",
      "you're invited",
    ],
    body: [
      "fest 20",
      "annual event",
      "register now",
      "last date to register",
      "participation certificate",
      "chief guest",
      "prize pool",
      "prize worth",
      "cultural night",
      "technical event",
      "college campus",
      "event day",
      "spot registration",
      "online registration",
      "team size",
      "entry fee",
    ],
    sender: [
      "unstop",
      "dare2compete",
      "fest",
      "events@",
      "college",
      "university",
    ],
  },

  // ─── Hackathons ──────────────────────────────────────────
  Hackathons: {
    subjects: [
      "hackathon",
      "hack20",
      "devfolio",
      "code jam",
      "build challenge",
      "24 hour",
      "48 hour",
      "coding marathon",
      "developer challenge",
      "innovation challenge",
      "your team",
      "submission",
    ],
    body: [
      "hackathon registration",
      "team formation",
      "prize pool",
      "prizes worth",
      "judging criteria",
      "submission deadline",
      "devfolio.co",
      "project submission",
      "hacker",
      "mentor session",
      "hacking begins",
      "build something",
      "form a team",
    ],
    sender: ["devfolio", "hackerearth", "mlh", "hackathon", "hack@"],
  },

  // ─── Leetcode ────────────────────────────────────────────
  Leetcode: {
    subjects: [
      "leetcode",
      "daily challenge",
      "weekly contest",
      "biweekly contest",
      "problem of the day",
      "your daily coding challenge",
      "your streak",
      "contest reminder",
      "leetcode premium",
    ],
    body: [
      "leetcode.com",
      "solve today's",
      "daily coding challenge",
      "contest starts",
      "your streak",
      "difficulty: easy",
      "difficulty: medium",
      "difficulty: hard",
      "acceptance rate",
      "submissions",
      "join contest",
      "premium features",
    ],
    sender: ["leetcode", "noreply@leetcode"],
  },

  // ─── NPTEL / Swayam ──────────────────────────────────────
  NPTEL: {
    subjects: [
      "nptel",
      "swayam",
      "week content",
      "week released",
      "assignment deadline",
      "noc certificate",
      "exam registration",
      "course content",
      "quiz deadline",
      "enrollment",
    ],
    body: [
      "nptel.ac.in",
      "swayam.gov.in",
      "week released",
      "assignment due",
      "proctored exam",
      "iit madras",
      "iit bombay",
      "iit kharagpur",
      "iit delhi",
      "iit kanpur",
      "iisc",
      "course certificate",
      "complete the assignments",
      "watch the videos",
    ],
    sender: ["nptel", "swayam", "noc@", "iit"],
  },

  // ─── OTP / Verification ──────────────────────────────────
  OTP: {
    subjects: [
      "verification code",
      "otp",
      "one time password",
      "security code",
      "login code",
      "authentication code",
      "verify your email",
      "confirm your email",
      "your code is",
      "sign-in code",
    ],
    body: [
      "your otp is",
      "your code is",
      "verification code is",
      "valid for",
      "expires in",
      "do not share",
      "one time password",
      "enter this code",
      "this code will expire",
      "use this code",
    ],
    sender: [],
  },

  // ─── Exams ───────────────────────────────────────────────
  Exams: {
    subjects: [
      "exam schedule",
      "examination notice",
      "admit card",
      "hall ticket",
      "exam result",
      "datesheet",
      "mid semester exam",
      "end semester exam",
      "practical exam",
      "viva voce",
      "supplementary exam",
      "backlog exam",
    ],
    body: [
      "examination hall",
      "exam center",
      "exam centre",
      "reporting time",
      "examination branch",
      "controller of examinations",
      "roll number",
      "seat number",
      "exam timing",
      "exam rules",
      "hall ticket",
      "valid id proof",
    ],
    sender: ["exam", "controller", "registrar", "academic", "coe@"],
  },

  // ─── Online Courses ──────────────────────────────────────
  "Online Courses": {
    subjects: [
      "course started",
      "new lecture",
      "new lecture available",
      "course completion",
      "certificate ready",
      "enrolled in",
      "congratulations on completing",
      "continue learning",
      "your course",
      "new course",
    ],
    body: [
      "continue learning",
      "your progress",
      "course certificate",
      "next lesson",
      "video lecture",
      "quiz due",
      "assignment due",
      "complete your course",
      "download certificate",
      "new section available",
    ],
    sender: ["coursera", "udemy", "edx", "skillshare", "udacity", "course"],
  },

  // ─── Job Alerts ──────────────────────────────────────────
  "Job Alerts": {
    subjects: [
      "job opening",
      "new job",
      "job alert",
      "jobs for you",
      "we're hiring",
      "now hiring",
      "job opportunity",
      "career opportunity",
      "job recommendation",
      "jobs matching",
      "apply now",
    ],
    body: [
      "apply now",
      "job description",
      "qualifications",
      "requirements",
      "salary:",
      "ctc:",
      "experience required",
      "job location",
      "apply before",
      "application deadline",
      "interview process",
      "we are looking for",
    ],
    sender: [
      "naukri",
      "indeed",
      "glassdoor",
      "monster",
      "jobs@",
      "careers@",
      "hiring@",
    ],
  },

  // ─── Newsletters ─────────────────────────────────────────
  Newsletters: {
    subjects: [
      "newsletter",
      "weekly digest",
      "this week in",
      "monthly roundup",
      "daily brief",
      "your weekly",
      "weekly update",
      "top stories",
    ],
    body: [
      "unsubscribe",
      "view in browser",
      "weekly roundup",
      "top stories",
      "curated for you",
      "you received this email because",
      "manage preferences",
      "email preferences",
      "this week's",
    ],
    sender: ["newsletter", "digest", "brief", "weekly", "updates@"],
  },

  // ─── Shopping ────────────────────────────────────────────
  Shopping: {
    subjects: [
      "order confirmed",
      "order shipped",
      "out for delivery",
      "delivered",
      "track your order",
      "your order #",
      "order id:",
      "invoice",
      "payment successful",
      "thank you for your order",
    ],
    body: [
      "track package",
      "delivery date",
      "order total",
      "shipping address",
      "estimated delivery",
      "order details",
      "item(s) ordered",
      "arriving",
      "shipped via",
      "tracking number",
    ],
    sender: [
      "amazon",
      "flipkart",
      "myntra",
      "orders@",
      "order-update@",
      "shipping@",
    ],
  },

  // ─── Finance ─────────────────────────────────────────────
  Finance: {
    subjects: [
      "transaction alert",
      "payment received",
      "payment successful",
      "money sent",
      "money received",
      "bank statement",
      "credit card statement",
      "debit alert",
      "credit alert",
      "upi transaction",
    ],
    body: [
      "transaction of rs",
      "inr ",
      "₹",
      "debited from",
      "credited to",
      "available balance",
      "transaction id",
      "reference number",
      "upi ref",
      "atm withdrawal",
      "account ending",
      "account number",
    ],
    sender: [
      "bank",
      "hdfc",
      "icici",
      "sbi",
      "axis",
      "kotak",
      "paytm",
      "phonepe",
      "gpay",
      "cred",
    ],
  },

  // ─── Meetings ────────────────────────────────────────────
  Meetings: {
    subjects: [
      "meeting invitation",
      "zoom meeting",
      "google meet",
      "teams meeting",
      "calendar invite",
      "scheduled with you",
      "meeting reminder",
      "join the meeting",
      "interview scheduled",
      "video call",
    ],
    body: [
      "join zoom meeting",
      "meet.google.com",
      "teams.microsoft.com",
      "meeting id:",
      "passcode:",
      "meeting password",
      "calendar event",
      "accept | tentative | decline",
      "add to calendar",
      "when:",
      "where:",
      "join url",
    ],
    sender: ["calendar", "zoom", "meet", "teams", "webex", "calendly"],
  },

  // ─── Promotions ──────────────────────────────────────────
  Promotions: {
    subjects: [
      "% off",
      "sale",
      "offer",
      "discount",
      "deal",
      "save ₹",
      "limited time",
      "exclusive",
      "promo",
      "coupon",
      "flash sale",
      "hurry",
      "only today",
      "last chance",
    ],
    body: [
      "shop now",
      "buy now",
      "use code",
      "promo code",
      "limited offer",
      "ends soon",
      "ends today",
      "hurry",
      "don't miss",
      "grab now",
      "% discount",
      "limited stock",
    ],
    sender: [],
  },

  // ─── Google ──────────────────────────────────────────────
  Google: {
    subjects: [
      "security alert",
      "new sign-in",
      "new device",
      "google account",
      "critical security alert",
      "suspicious activity",
      "review your security",
      "recovery information",
      "verify it's you",
    ],
    body: [
      "google.com/accounts",
      "myaccount.google.com",
      "someone might have",
      "new device signed in",
      "new sign-in",
      "we detected",
      "secure your account",
      "activity on your account",
      "review this activity",
      "wasn't you",
    ],
    sender: [
      "google",
      "accounts.google",
      "security-noreply@google",
      "no-reply@google",
    ],
  },

  // ─── Social Media ────────────────────────────────────────
  "Social Media": {
    subjects: [
      "tagged you",
      "mentioned you",
      "liked your",
      "commented on",
      "friend request",
      "follow request",
      "new follower",
      "shared your",
      "posted in",
    ],
    body: [
      "tagged you in",
      "mentioned you in",
      "liked your post",
      "commented on your",
      "reply to your",
      "see the post",
      "view on facebook",
      "view on instagram",
    ],
    sender: ["facebook", "instagram", "twitter", "tiktok", "pinterest"],
  },

  // ─── Food Delivery ───────────────────────────────────────
  "Food Delivery": {
    subjects: [
      "order placed",
      "order confirmed",
      "on the way",
      "arriving soon",
      "delivered",
      "your order from",
      "order ready",
      "food is ready",
    ],
    body: [
      "your order is",
      "delivery partner",
      "estimated time",
      "track order",
      "delivery address",
      "order total",
      "payment:",
      "items ordered",
      "restaurant",
      "arriving in",
      "out for delivery",
    ],
    sender: ["swiggy", "zomato", "dominos", "ubereats", "doordash"],
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

function extractDomain(email) {
  if (!email) return null;
  const match = email.match(/@([^>]+)/);
  if (match) {
    return match[1].toLowerCase().replace(/[>\s]/g, "");
  }
  return null;
}

function extractSenderName(sender) {
  if (!sender) return "";
  const nameMatch = sender.match(/^"?([^"<]+)"?\s*</);
  if (nameMatch) {
    return nameMatch[1].trim().toLowerCase();
  }
  const emailMatch = sender.match(/([^@]+)@/);
  if (emailMatch) {
    return emailMatch[1].replace(/[._-]/g, " ").toLowerCase();
  }
  return sender.toLowerCase();
}

function matchesAny(text, patterns) {
  if (!text || !patterns || patterns.length === 0)
    return { matches: false, count: 0, matched: [] };
  const textLower = text.toLowerCase();
  let count = 0;
  const matched = [];

  for (const pattern of patterns) {
    if (textLower.includes(pattern.toLowerCase())) {
      count++;
      matched.push(pattern);
    }
  }

  return { matches: count > 0, count, matched };
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN CLASSIFICATION ENGINE
// ══════════════════════════════════════════════════════════════════════════════

export async function classifyEmailLocally(emailData) {
  const { subject, body, sender, snippet } = emailData;

  const subjectText = (subject || "").toLowerCase();
  const bodyText = (body || snippet || "").toLowerCase();
  const fullText = `${subjectText} ${bodyText}`;

  const domain = extractDomain(sender);
  const senderName = extractSenderName(sender);

  console.log(`[LocalML] ═══════════════════════════════════════════`);
  console.log(`[LocalML] Subject: "${subject?.slice(0, 60)}"`);
  console.log(`[LocalML] From: ${sender}`);
  console.log(`[LocalML] Domain: ${domain}`);

  // ──────────────────────────────────────────────────────────
  // STEP 1: DOMAIN MATCHING (95% confidence) - Most Reliable
  // ──────────────────────────────────────────────────────────
  if (domain) {
    for (const [pattern, category] of Object.entries(DOMAIN_MAPPINGS)) {
      if (domain.includes(pattern)) {
        console.log(`[LocalML] ✓ DOMAIN MATCH: "${domain}" → ${category}`);
        return {
          category,
          confidence: 0.95,
          reasoning: `Domain: ${domain}`,
          alternativeCategories: [],
          scores: { [category]: 100 },
        };
      }
    }
  }

  // ──────────────────────────────────────────────────────────
  // STEP 2: EMAIL PATTERN MATCHING (Score-based)
  // ──────────────────────────────────────────────────────────
  const categoryScores = {};
  const categoryReasons = {};

  for (const [category, patterns] of Object.entries(EMAIL_PATTERNS)) {
    let score = 0;
    const reasons = [];

    // Check sender patterns first (highest weight = 5)
    if (patterns.sender && patterns.sender.length > 0) {
      for (const senderPattern of patterns.sender) {
        if (
          senderName.includes(senderPattern) ||
          (domain && domain.includes(senderPattern))
        ) {
          score += 5;
          reasons.push(`sender: "${senderPattern}"`);
          break;
        }
      }
    }

    // Check subject patterns (high weight = 4)
    if (patterns.subjects) {
      const subjectMatch = matchesAny(subjectText, patterns.subjects);
      if (subjectMatch.matches) {
        score += 4 * Math.min(subjectMatch.count, 2); // Max 8 points from subject
        reasons.push(
          ...subjectMatch.matched.slice(0, 2).map((m) => `subject: "${m}"`),
        );
      }
    }

    // Check body patterns (medium weight = 2)
    if (patterns.body) {
      const bodyMatch = matchesAny(bodyText, patterns.body);
      if (bodyMatch.matches) {
        score += 2 * Math.min(bodyMatch.count, 3); // Max 6 points from body
        reasons.push(
          ...bodyMatch.matched.slice(0, 2).map((m) => `body: "${m}"`),
        );
      }
    }

    if (score > 0) {
      categoryScores[category] = score;
      categoryReasons[category] = reasons.slice(0, 4);
    }
  }

  // ──────────────────────────────────────────────────────────
  // STEP 3: CUSTOM KEYWORDS (fallback, lower weight)
  // ──────────────────────────────────────────────────────────
  const keywords = await loadKeywords();

  for (const [category, categoryKeywords] of Object.entries(keywords)) {
    // Skip if already has good score from patterns
    if (categoryScores[category] && categoryScores[category] >= 5) continue;

    let score = categoryScores[category] || 0;
    const reasons = categoryReasons[category] || [];

    for (const keyword of categoryKeywords) {
      const keywordLower = keyword.toLowerCase();

      if (subjectText.includes(keywordLower)) {
        score += 3;
        reasons.push(`kw-subject: "${keyword}"`);
      } else if (bodyText.includes(keywordLower)) {
        score += 1;
        if (reasons.length < 3) {
          reasons.push(`kw-body: "${keyword}"`);
        }
      }
    }

    if (score > 0) {
      categoryScores[category] = score;
      categoryReasons[category] = reasons.slice(0, 4);
    }
  }

  // ──────────────────────────────────────────────────────────
  // STEP 4: SELECT BEST CATEGORY
  // ──────────────────────────────────────────────────────────
  const sorted = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    console.log(`[LocalML] ✗ No category match found`);
    return {
      category: null,
      confidence: 0,
      reasoning: "No matching patterns found",
      alternativeCategories: [],
      scores: {},
    };
  }

  const [bestCategory, bestScore] = sorted[0];
  const alternatives = sorted.slice(1, 4).map(([cat]) => cat);

  // Minimum threshold: require at least 1 point to classify
  // Any match is better than leaving unclassified
  const MIN_THRESHOLD = 1;

  if (bestScore < MIN_THRESHOLD) {
    console.log(`[LocalML] ✗ No matches found at all`);
    return {
      category: null,
      confidence: 0,
      reasoning: `No patterns matched`,
      alternativeCategories: alternatives,
      scores: categoryScores,
    };
  }

  // Calculate confidence based on score
  let confidence;
  if (bestScore >= 15) {
    confidence = 0.98;
  } else if (bestScore >= 10) {
    confidence = 0.95;
  } else if (bestScore >= 7) {
    confidence = 0.9;
  } else if (bestScore >= 5) {
    confidence = 0.85;
  } else if (bestScore >= 4) {
    confidence = 0.75;
  } else if (bestScore >= 3) {
    confidence = 0.65;
  } else if (bestScore >= 2) {
    confidence = 0.55;
  } else {
    confidence = 0.45; // Low confidence but still classify
  }

  // Reduce confidence if close second place (ambiguous)
  if (sorted.length > 1) {
    const gap = bestScore - sorted[1][1];
    if (gap < 3) {
      confidence = Math.max(confidence - 0.1, 0.55);
    }
  }

  const reasons = categoryReasons[bestCategory] || [];
  console.log(`[LocalML] ✓ CLASSIFIED: ${bestCategory}`);
  console.log(
    `[LocalML]   Score: ${bestScore}, Confidence: ${(confidence * 100).toFixed(0)}%`,
  );
  console.log(`[LocalML]   Reasons: ${reasons.join(", ")}`);

  return {
    category: bestCategory,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: reasons.slice(0, 3).join(", ") || "Pattern analysis",
    alternativeCategories: alternatives,
    scores: categoryScores,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// LEARNING FROM USER CORRECTIONS
// ══════════════════════════════════════════════════════════════════════════════

export async function learnFromCorrection(emailData, correctCategory) {
  const domain = extractDomain(emailData.sender);

  if (domain) {
    const stored = (await chrome.storage.local.get("learnedDomains")) || {};
    const learnedDomains = stored.learnedDomains || {};
    learnedDomains[domain] = correctCategory;
    await chrome.storage.local.set({ learnedDomains });
    console.log(`[LocalML] Learned: ${domain} → ${correctCategory}`);
  }
}

export async function getClassifierStats() {
  const keywords = await loadKeywords();
  const stored = (await chrome.storage.local.get("learnedDomains")) || {};

  return {
    totalCategories: Object.keys(EMAIL_PATTERNS).length,
    domainMappings: Object.keys(DOMAIN_MAPPINGS).length,
    emailPatterns: Object.values(EMAIL_PATTERNS).reduce(
      (sum, p) => sum + (p.subjects?.length || 0) + (p.body?.length || 0),
      0,
    ),
    customKeywords: Object.values(keywords).flat().length,
    learnedDomains: Object.keys(stored.learnedDomains || {}).length,
  };
}
