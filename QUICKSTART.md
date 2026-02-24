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

1. **Personalized "For You" Section** - ML recommendations based on purchase history
2. **Smart Cart Suggestions** - Hybrid collaborative filtering in action
3. **Leave a Review** - See Bayesian quality adjustment affect recommendations
4. **AI Ticket Generator** - Visit `/tickets` for ML-powered task estimation

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
