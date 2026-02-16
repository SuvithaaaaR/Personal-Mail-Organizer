# Personal Mail Organizer

A Chrome Extension that automatically organizes your Gmail inbox using local ML classification. **No API keys required.**

## Features

- **100% Local Classification** – Works offline, no external AI APIs needed
- **Smart Pattern Matching** – Uses domain recognition, email templates, and keyword analysis
- **Auto-Organize** – Runs automatically at configurable intervals
- **20+ Categories** – GitHub, LinkedIn, Internshala, ChatGPT, Discord, Hackathons, and more
- **Custom Keywords** – Add your own categories and keywords
- **Keep in Inbox** – Labels emails without removing them from inbox
- **Learning from Corrections** – Learns from your corrections to improve over time

## How It Works

1. **Learned Patterns** – Checks patterns learned from your corrections (highest priority)
2. **Domain Matching** – Recognizes 200+ email domains (github.com → GitHub)
3. **Pattern Analysis** – Matches real email templates (subjects, body content)
4. **Keyword Scoring** – Falls back to keyword matching for unknown domains

## Learning System

The classifier learns when you correct a classification:

- **Domain** → Category mapping (e.g., `newcompany.com → Job Alerts`)
- **Sender name** → Category (e.g., `noreply → OTP`)
- **Subject phrases** → Category (e.g., `"team meeting" → Meetings`)

View and manage learned patterns in **Settings → Learned Patterns**.

## Setup

### 1. Create Google OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable **Gmail API**
3. Create **OAuth 2.0 Client ID** (Chrome Extension type)
4. Copy Client ID to `manifest.json`

### 2. Load Extension

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select this folder
4. Copy Extension ID back to Google Cloud OAuth settings

### 3. Use

1. Click extension icon → Sign in with Google
2. Click **Organize Inbox Now**
3. Enable **Auto-organize** for background processing

## Categories

| Category       | Examples                       |
| -------------- | ------------------------------ |
| GitHub         | Pull requests, issues, actions |
| LinkedIn       | Connections, job alerts        |
| Internshala    | Shortlists, internships        |
| ChatGPT        | OpenAI emails                  |
| Discord        | Verification, server invites   |
| Leetcode       | Daily challenges, contests     |
| College Events | Fests, symposiums              |
| Hackathons     | Devfolio, MLH                  |
| NPTEL          | Course content, assignments    |
| Job Alerts     | Naukri, Indeed, Glassdoor      |
| Shopping       | Order confirmations            |
| Finance        | Transaction alerts             |
| OTP            | Verification codes             |

## Project Structure

```
src/
├── background.js      # Service worker
├── localClassifier.js # Local ML engine
├── gmail.js           # Gmail API wrapper
├── config.js          # Settings
├── keywords.js        # Custom keywords
├── popup/             # Extension popup
└── options/           # Settings page
```

## License

MIT
