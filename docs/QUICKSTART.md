# Quick Start Guide

## 🚀 Get Running in 60 Seconds

### With Docker (Easiest!)

1. **Run the quickstart script:**
   ```bash
   ./quickstart.sh
   ```

2. **Open your browser:**
   - Frontend: http://localhost:3000
   - GraphQL API: http://localhost:8000/graphql

3. **Sign in with demo account:**
   - Email: `test@example.com`
   - Password: `test`
   - Or click **"Continue as Guest"** to try without signing in!

4. **Explore the features!**

### Without Docker

1. **Install dependencies:**
   ```bash
   # Frontend
   yarn install
   
   # Backend
   cd src/app/api/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python3 seed.py
   ```

2. **Create `.env.local` file:**
   ```bash
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Start both servers:**
   ```bash
   # Terminal 1: Backend
   cd src/app/api/backend
   source venv/bin/activate
   python3 app.py
   
   # Terminal 2: Frontend
   yarn dev
   ```

## 🎯 What to Try

1. **Full Auth System** - Sign up, GitHub SSO, Guest mode, Password recovery
3. **Shopping Assistant** - Visit `/assistant` or click the floating widget for AI-powered product discovery
4. **Testing Dashboard** - Enable Dev Mode → visit `/dev/testing` for the amazing visual test runner! 🎉
5. **Smart Cart Suggestions** - Hybrid collaborative filtering in action
6. **Leave a Review** - See Bayesian quality adjustment affect recommendations
7. **Leave a Review** - See Bayesian quality adjustment affect recommendations
5. **AI Ticket Generator** - Visit `/tickets` for ML-powered task estimation (dev mode)

## 📖 Full Documentation

See [README.md](README.md) for complete documentation, architecture details, and all features.

## 🆘 Troubleshooting

**Port already in use:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use Docker (handles ports automatically)
./quickstart.sh
```

**Docker issues:**
```bash
# Fresh start
docker compose down -v
./quickstart.sh
```

**Module not found:**
```bash
# Reinstall dependencies
yarn install
cd src/app/api/backend && pip install -r requirements.txt
```
