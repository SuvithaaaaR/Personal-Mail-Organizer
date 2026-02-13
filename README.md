<<<<<<< HEAD
# Personal Mail Organizer – Chrome Extension 🤖

A Chrome Extension that automatically organises your Gmail inbox using OpenAI GPT for intelligent email classification and labeling.

## Features

- ✨ **AI-Powered Classification** – Uses OpenAI GPT-4o-mini for context-aware email categorisation
- 📊 **Smart Confidence Scoring** – Only moves emails when AI confidence is high enough
- 🔄 **Hybrid Approach** – Falls back to keyword matching when AI confidence is low
- 🔔 **Auto-Organize** – Schedule automatic runs at a configurable interval
- ⚙️ **Full Options Page** – Adjust thresholds, batch sizes, categories, and keywords from the browser
- 📝 **Live Activity Log** – See classification reasoning in real-time inside the popup
- 🎨 **Modern Popup UI** – Clean stats dashboard with category breakdown

## Project Structure

```
├── manifest.json              # Chrome Extension manifest (MV3)
├── package.json               # Dev tooling (eslint, etc.)
├── icons/                     # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── src/
    ├── background.js          # Service worker – orchestrates everything
    ├── config.js              # Default settings + chrome.storage helpers
    ├── keywords.js            # Default keyword categories + storage helpers
    ├── classifier.js          # AI (OpenAI) + keyword-based email classifier
    ├── gmail.js               # Gmail REST API wrapper via chrome.identity OAuth
    ├── popup/
    │   ├── popup.html         # Extension popup UI
    │   ├── popup.css
    │   └── popup.js
    └── options/
        ├── options.html       # Full settings page
        ├── options.css
        └── options.js
```

## Setup

### 1. Google Cloud – Create OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. **Enable the Gmail API**: APIs & Services → Library → search "Gmail API" → Enable
4. **Create OAuth 2.0 credentials**:
   - APIs & Services → Credentials → Create Credentials → **OAuth client ID**
   - Application type: **Chrome Extension**
   - Item ID: leave blank for now (you'll get this after loading the extension)
5. Copy the **Client ID** (looks like `123456789.apps.googleusercontent.com`)
6. Open `manifest.json` and replace `YOUR_CHROME_CLIENT_ID.apps.googleusercontent.com` with your Client ID

### 2. Load the Extension in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select this project folder
4. Note the **Extension ID** shown on the card
5. Go back to Google Cloud Console → your OAuth credential → add/update the **Item ID** with the Extension ID

### 3. Configure OpenAI API Key

1. Click the extension icon → ⚙️ Settings
2. Paste your OpenAI API key (get one at [platform.openai.com](https://platform.openai.com/api-keys))
3. Choose your model (gpt-4o-mini is recommended for speed/cost)
4. Save

### 4. Customise Categories

In the Settings page, scroll to **Email Categories & Keywords** and edit the JSON to add, remove, or modify categories and their keyword triggers.

## Usage

### Organise Inbox Manually

1. Click the extension icon in the toolbar
2. Sign in with Google (first time only)
3. Click **🚀 Organize Inbox Now**
4. Watch progress and results in real-time

### Enable Auto-Organize

Toggle **Auto-organize** in the popup. The extension will run in the background at the interval configured in Settings (default: every 30 minutes).

### View Results

After each run, the popup shows:

- Total processed / categorised / skipped / failed
- Category breakdown with counts
- Full activity log with timestamps

## How It Works

### AI Classification Flow

1. **Email Fetched** – Gmail REST API retrieves inbox messages
2. **AI Analysis** – OpenAI GPT reads subject, body, sender, attachments
3. **Category Selected** – best match from your custom categories
4. **Confidence Scored** – 0.0 → 1.0 (only auto-labels above your threshold)
5. **Keyword Fallback** – if AI confidence is low, keywords take over
6. **Label Applied** – Gmail label created/applied automatically

### Example Classification Result

```json
{
  "category": "Meetings",
  "confidence": 0.95,
  "reasoning": "Email contains calendar invite for team standup with Zoom link",
  "alternativeCategories": ["Job Alerts"]
}
```

## Configuration Reference

All settings are available in **⚙️ Settings** (Options page):

| Setting                  | Default     | Description                            |
| ------------------------ | ----------- | -------------------------------------- |
| AI Classification        | Enabled     | Toggle OpenAI-based classification     |
| AI Confidence Threshold  | 0.70        | Minimum AI confidence to consider      |
| Min Confidence for Label | 0.85        | Auto-label only above this score       |
| Fallback to Keywords     | Enabled     | Use keywords when AI is unsure         |
| Max Emails per Run       | 30          | Limit emails processed each run        |
| Process Only Unread      | Off         | Restrict to unread emails only         |
| Keep in Inbox            | Off         | Don't remove INBOX label after sorting |
| Auto-Organize            | Off         | Background scheduling                  |
| Auto-Organize Interval   | 30 min      | How often to run automatically         |
| OpenAI Model             | gpt-4o-mini | Model selection                        |

## Cost Estimation

| Model       | ≈ Cost / 1 000 emails | Speed        | Accuracy |
| ----------- | --------------------- | ------------ | -------- |
| gpt-4o-mini | $0.15                 | ~1-2 s/email | 85-92 %  |
| gpt-4o      | $2.50                 | ~2-3 s/email | 92-97 %  |

## Troubleshooting

### AI Not Working

1. Open Settings and confirm your OpenAI API key is saved
2. Make sure "Enable AI Classification" is checked
3. Open the browser console (F12) on the popup/background for error messages
4. The extension falls back to keywords automatically if the API fails

### Low Classification Accuracy

- Lower the confidence threshold temporarily to see more results
- Add more keywords for categories that are being missed
- Switch to gpt-4o for more accurate (but pricier) classification

### Gmail Permission Issues

- Make sure the OAuth Client ID in `manifest.json` matches your Google Cloud project
- The Extension ID must be registered in the OAuth credential's **Item ID**
- Re-authenticate by clicking "Sign out" then "Sign in with Google"

## Future Enhancements

- 🔔 Real-time push notifications via Gmail watch API
- 📊 Stats dashboard over time
- 🤝 Multi-account support
- 🔗 Integration with task managers (Trello, Notion)
- 🧠 On-device classification for privacy

## License

MIT
=======
![Repository Stats](https://github-repo-readme-stats.vercel.app/api/?username=suvithaaaar&repo=personal-mail-organizer&theme=catppuccin)
>>>>>>> 349ff4b6f0bb236d630043f715ffec07d827c17e
