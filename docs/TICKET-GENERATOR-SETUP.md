# AI Ticket Generator - Setup Guide

## 🎯 What This Does

This system generates comprehensive development tickets with ML-powered time estimations by analyzing your GitHub repository history.

## 🚀 Quick Start

### 1. GitHub OAuth Setup

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: AI Ticket Generator (or your app name)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`
4. Click "Register application"
5. Copy the **Client ID** and generate a **Client Secret**

### 2. Environment Variables

Create `.env.local` in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your GitHub credentials:

```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id_here
PYTHON_BACKEND_URL=http://localhost:8000
```

### 3. Install Python Dependencies

```bash
cd src/app/api/backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Start the Services

**Terminal 1 - Python Backend:**
```bash
cd src/app/api/backend
source venv/bin/activate
python app.py
```

**Terminal 2 - Next.js Frontend:**
```bash
yarn dev
```

### 5. Use the App

1. Navigate to http://localhost:3000/tickets
2. Click "Connect GitHub"
3. Authorize the application
4. Enter a repository (e.g., `username/repo`)
5. Describe your task
6. Click "Generate Ticket"
7. Download the generated markdown file!

## 🏗️ How It Works

```
User Input → GitHub OAuth → Fetch Repo History → Analyze Patterns → 
ML Estimation → Generate Ticket → Download .md File
```

### Data Collected from GitHub:
- Branch creation and merge times
- Pull request metrics
- Commit patterns
- File change statistics

### Estimation Factors:
- **Complexity keywords** (auth, API, refactor, etc.)
- **Scope** (description length and detail)
- **Historical patterns** (team velocity)
- **Similar past tasks** (keyword matching)

## 📊 Features

- ✅ GitHub OAuth integration
- ✅ Repository history analysis with caching
- ✅ ML-powered time estimation
- ✅ Similar task matching
- ✅ Comprehensive ticket generation
- ✅ Markdown export
- ✅ Confidence scoring

## 🔧 Advanced Configuration

### Add LLM for Better Tickets (Optional)

Add to `.env.local`:

```env
OPENAI_API_KEY=sk-...
```

This will enhance ticket generation quality using GPT-4.

### Cache Management

Repository data is cached in `src/app/api/backend/data/repo_cache.db` (SQLite).

To clear cache:
```bash
rm src/app/api/backend/data/repo_cache.db
```

### Adjust Estimation Logic

Edit `src/app/api/backend/ticket_estimator.py` to tune:
- Complexity keywords and weights
- Base hours per context
- Confidence calculations

## 📁 Project Structure

```
src/
  app/
    tickets/
      page.tsx              # Main UI
    api/
      auth/github/callback/ # OAuth handler
      tickets/generate/     # Next.js API route
      backend/
        app.py              # Flask server
        github_client.py    # GitHub API client
        ticket_estimator.py # Estimation engine
        ticket_generator.py # Markdown generator
        data/               # SQLite cache
```

## 🐛 Troubleshooting

**"Not authenticated with GitHub"**
- Make sure you connected GitHub on the /tickets page
- Check browser cookies (should have `github_token`)

**"Failed to fetch repository"**
- Verify the repository name format: `owner/repo`
- Check if you have access to the repository
- Try refreshing the GitHub connection

**Python backend not responding**
- Check if backend is running on port 8000
- Look for errors in the Python terminal
- Verify `requirements.txt` dependencies installed

**No similar tasks found**
- Normal for new repositories
- Requires merged pull requests in history
- Will improve as you use the repo more

## 🎯 Next Steps

1. **Train ML Model**: Collect more data and train an actual ML model
2. **GitHub Issues Integration**: Auto-create issues from generated tickets
3. **Team Analytics**: Track estimation accuracy over time
4. **Multi-repo Analysis**: Compare patterns across projects

## 💡 Tips

- More detailed task descriptions → better estimates
- First-time analysis takes longer (fetching from GitHub)
- Subsequent requests use cached data (faster)
- Estimation accuracy improves with more repo history
- Download tickets to `docs/tickets/` for tracking

Enjoy your AI-powered ticket generation! 🎉
