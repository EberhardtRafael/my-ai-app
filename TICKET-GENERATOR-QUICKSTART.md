# 🎫 Quick Start - AI Ticket Generator

## What is this?

An AI-powered system that generates comprehensive development tickets with ML-based time estimations by analyzing your GitHub repository history.

## Setup (5 minutes)

### 1. Run Setup Script
```bash
./setup-ticket-generator.sh
```

### 2. Configure GitHub OAuth

1. Visit https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **App name**: AI Ticket Generator
   - **Homepage**: `http://localhost:3000`
   - **Callback URL**: `http://localhost:3000/api/auth/github/callback`
4. Copy Client ID and Client Secret

### 3. Update Environment Variables

Edit `.env.local`:
```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
```

### 4. Start Both Servers

**Terminal 1 - Python Backend:**
```bash
yarn backend
# or manually: cd src/app/api/backend && source venv/bin/activate && python app.py
```

**Terminal 2 - Next.js Frontend:**
```bash
yarn dev
```

### 5. Use It!

1. Visit http://localhost:3000/tickets
2. Click "Connect GitHub"
3. Enter repo: `username/repo`
4. Describe your task
5. Click "Generate Ticket"
6. Download the markdown file!

## Example

**Input:**
```
Repo: sarate/ai-powered-fullstack-ecommerce-platform
Task: Add dark mode toggle to header with system preference detection and localStorage persistence
Context: Frontend
```

**Output:** (see generated ticket)
- ✅ Estimated time: 6h (5-8h range)
- ✅ Confidence: 87%
- ✅ Similar tasks from history
- ✅ Comprehensive acceptance criteria
- ✅ Technical notes
- ✅ Ready-to-use markdown

## How It Works

1. **Connects to GitHub** via OAuth
2. **Fetches repo history** (branches, PRs, merge times)
3. **Analyzes patterns** with ML algorithms
4. **Finds similar tasks** from past work
5. **Generates ticket** with time estimation
6. **Downloads markdown** for your project

## Features

- 🔐 Secure GitHub OAuth
- 📊 Repository history analysis
- 🧠 ML-powered estimations
- 🔍 Similar task matching
- 📝 Professional ticket generation
- 💾 Smart caching (fast subsequent requests)
- ⬇️ Markdown export

## Troubleshooting

**"Not authenticated"** → Connect GitHub on /tickets page

**"Failed to fetch repo"** → Check repo name format: `owner/repo`

**Backend not responding** → Make sure Python backend is running on port 8000

## Documentation

- 📖 [Complete Setup Guide](./TICKET-GENERATOR-SETUP.md)
- 🏗️ [Implementation Details](./TICKET-GENERATOR-IMPLEMENTATION.md)

---

**Built with:** Next.js, React, TypeScript, Python, Flask, GitHub API

Need help? Check the full documentation above! 🚀
