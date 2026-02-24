# 🛍️ AI-Powered E-Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![Test Coverage](https://img.shields.io/badge/Coverage-94%25-brightgreen)]()
[![ML](https://img.shields.io/badge/ML-Hybrid_Recommendations-orange)]()
[![Bayesian](https://img.shields.io/badge/Statistics-Bayesian-purple)]()
[![Setup Time](https://img.shields.io/badge/Setup-60_seconds-success)]()

> **Quick Start**: `./quickstart.sh` → Running in 60 seconds with Docker!

A sophisticated, full-stack e-commerce application demonstrating advanced machine learning, Bayesian statistics, and AI-powered features for personalized shopping experiences and intelligent development workflows.

## 🌟 Project Overview

This isn't just another e-commerce site—it's a showcase of cutting-edge technologies working together to create a truly intelligent shopping platform. Built with Next.js 15, Python Flask, GraphQL, and powered by multiple machine learning models and statistical algorithms, this project demonstrates production-ready implementations of personalized recommendations, quality-aware ranking systems, user review analytics, and AI-assisted development tools.

## 🚀 Key Features

### 🤖 Machine Learning & AI

#### 1. **Hybrid Recommendation Engine** (Collaborative + Content-Based Filtering)
- **Collaborative Filtering**: Analyzes user-item interactions using cosine similarity on purchase history
- **Content-Based Filtering**: Matches products based on category, attributes, and metadata similarity
- **Hybrid Approach**: Combines both methods (60% collaborative, 40% content-based) for optimal recommendations
- **Smart Fallbacks**: Three-tier strategy (purchase history → favorites → trending) handles cold-start problem elegantly
- **Context-Aware**: Different recommendation strategies for cart ("You May Also Like"), homepage ("For You"), and cross-category suggestions

#### 2. **Bayesian Rating Quality System** (Wilson Score Interval)
- **Statistical Rigor**: Uses Lower Bound of Wilson Score Interval for confidence-adjusted ratings
- **Cold-Start Protection**: New products without reviews receive NO penalties (quality factor = 1.0)
- **Confidence-Based Adjustment**: Only applies significant penalties/boosts when sufficient data exists
  - Minimum 5 reviews for penalties
  - Minimum 10 reviews for boosts
- **Dynamic Quality Factor**: Scales from 0.5x (terrible products with many bad reviews) to 1.2x (excellent products with strong ratings)
- **Prevents Negative Feedback Loops**: Mathematically sound approach avoids burying new products while protecting users from proven low-quality items
- **Integration**: Quality factors multiply with recommendation scores before final ranking

**Mathematical Formula:**
```

Wilson Score = (p̂ + z²/2n - z√(p̂(1-p̂)/n + z²/4n²)) / (1 + z²/n)
where p̂ = (rating_avg - 1) / 4, n = review_count, z = 1.96 (95% CI)
```

#### 3. **AI Ticket Generator** (GitHub Integration + ML Estimation)
- **GitHub OAuth Integration**: Seamless authentication and repository access
- **Repository Analysis**: Fetches branch history, PR metrics, commit patterns, merge time statistics
- **ML-Based Time Estimation**:
  - Keyword complexity analysis (auth, API, database, etc.) with weighted multipliers
  - Scope detection based on description detail and length
  - Historical velocity adjustments from team's actual completion times
  - Context-aware estimates (frontend, backend, full-stack)
- **Similar Task Matching**: Uses Jaccard similarity on keyword extraction to find historical references
- **Comprehensive Ticket Output**: Generates markdown tickets with user stories, acceptance criteria, technical notes, estimation breakdown, and similar task references

#### 4. **Personalized "For You" Section**
- **User Segmentation**: Different strategies for existing customers, browsers, and new users
- **Collaborative Filtering**: Recommends products similar to past purchases using item-item similarity
- **Category-Based Recommendations**: For users with favorites but no purchases
- **Trending Fallback**: Shows popular products (by order frequency) to new users
- **Real-Time Updates**: Recommendations refresh based on latest user actions

### 📊 Advanced Analytics & Statistics

#### Review System with Statistical Confidence
- **User Reviews**: Full CRUD functionality for authenticated users
- **Rating Aggregation**: Calculates average ratings and confidence intervals
- **Quality Metrics**: Integrates with Bayesian adjustment for recommendation ranking
- **Review Helpfulness**: Tracks helpful votes (thumbs up) for community curation

#### Recommendation Quality Metrics
- **A/B Testing Ready**: Tracks quality factors and original vs adjusted scores
- **Explainability**: Logs show why each product was recommended and how ratings affected ranking
- **Performance Monitoring**: Database-backed analytics for recommendation effectiveness

### 🎨 Full-Featured E-Commerce

#### User Experience
- **Authentication**: NextAuth.js integration with credentials provider
- **Product Catalog**: Browse products with categories, variants (color/size), and inventory
- **Product Detail Pages**: Rich product information, variant selection, reviews, recommendations
- **Shopping Cart**: Add/remove items, quantity management, persistent cart state
- **Favorites/Wishlist**: Save products for later with heart icon interactions
- **Order History**: Complete order tracking with status and timestamps
- **Checkout Flow**: Streamlined purchase process with order confirmation

#### Backend Architecture
- **GraphQL API**: Type-safe, flexible queries and mutations via Strawberry GraphQL
- **Python Flask**: High-performance backend with ML capabilities
- **SQLite Database**: Lightweight, file-based database with full relational support
- **Database Migrations**: Version-controlled schema changes with backup systems
- **Seeded Data**: Rich test dataset with products, users, orders, reviews

### 🧪 Testing & Quality Assurance

#### Frontend Testing (Jest + React Testing Library)
- **Component Tests**: Comprehensive coverage for UI components
- **Integration Tests**: Tests for context providers, hooks, and data fetching
- **Coverage Reports**: HTML reports with line-by-line coverage visualization
- **Test Utilities**: Custom matchers and setup for consistent testing

#### Backend Testing (pytest)
- **API Tests**: GraphQL query and mutation testing
- **ML Algorithm Tests**: Validates recommendation engine outputs
- **Statistical Tests**: Verifies Bayesian calculations and edge cases
- **Database Tests**: Ensures data integrity and query correctness
- **Coverage Reports**: HTML reports for Python codebase

#### Test Scripts
```bash
yarn test              # Frontend tests
yarn test:coverage     # Frontend with coverage
yarn test:python       # Backend tests
yarn test:python:coverage  # Backend with coverage
yarn test:all          # Both frontend and backend
```

## 🏗️ Technical Architecture

### Frontend Stack
- **Next.js 15**: React framework with App Router, Server Components, and streaming
- **TypeScript**: Type-safe development across the entire frontend
- **Tailwind CSS 4**: Utility-first styling with custom design system
- **NextAuth.js**: Authentication with session management
- **Context API**: Global state management for cart, favorites, and user session
- **Biome**: Fast, modern linting and formatting (ESLint/Prettier replacement)

### Backend Stack
- **Python 3.x**: Core backend language
- **Flask**: Lightweight WSGI web framework
- **Strawberry GraphQL**: Python GraphQL library with type hints
- **SQLite**: Embedded relational database
- **NumPy**: Numerical computing for ML algorithms
- **scikit-learn**: Machine learning utilities (cosine similarity, preprocessing)
- **Requests**: HTTP library for GitHub API integration

### Key Backend Modules
- `app.py`: Flask server with GraphQL endpoint and CORS configuration
- `schema.py`: GraphQL schema definitions (queries, mutations, types)
- `models.py`: Database models and ORM layer
- `recommendations.py`: ML recommendation engine with collaborative and content-based filtering
- `github_client.py`: GitHub API client with caching for ticket generator
- `ticket_generator.py`: AI-powered ticket creation and estimation
- `ticket_estimator.py`: ML-based time estimation algorithms

## 🚀 Quick Start (60 Seconds!)

### Choose Your Method

| Method | Command | Best For | Setup Time |
|--------|---------|----------|------------|
| **🐳 Docker** | `./quickstart.sh` | First-time users, demos, isolation | 60 seconds |
| **⚡ Dev Script** | `./dev-start.sh` | Developers without Docker | 2-3 minutes |
| **🛠️ Manual** | See below | Full control, learning | 5 minutes |

### Option 1: Docker (Recommended - One Command!)

**Prerequisites:** Docker and Docker Compose

```bash
./quickstart.sh
```

That's it! The script will:
- ✅ Build and start both frontend and backend containers
- ✅ Initialize and seed the database with demo data
- ✅ Run health checks to ensure everything works
- ✅ Display demo account credentials
- ✅ Show you what features to try

**Access the application:**
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **GraphQL API:** [http://localhost:8000/graphql](http://localhost:8000/graphql)

**Demo Accounts:**
| Email | Password | Description |
|-------|----------|-------------|
| `test@example.com` | `test` | User with purchase history (best for ML demos) |
| `john@example.com` | `password123` | Another user with different preferences |
| `jane@example.com` | `password123` | User with favorites but no purchases |

### Option 2: Quick Development Script

**Prerequisites:** Node.js 18+ and Python 3.8+

```bash
./dev-start.sh
```

This script will:
- ✅ Install all dependencies (frontend & backend)
- ✅ Create Python virtual environment
- ✅ Initialize and seed database
- ✅ Start both servers automatically
- ✅ Handle cleanup on exit (Ctrl+C)

### Option 3: Manual Setup

**Prerequisites:**
- **Node.js** 18+ and npm/yarn
- **Python** 3.8+
- **Git**

#### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd my-ai-app
```

2. **Install frontend dependencies**
```bash
yarn install
```

3. **Set up backend environment**
```bash
cd src/app/api/backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. **Set up environment variables**
```bash
# Copy example environment file
cp .env.local.example .env.local

# Required variables:
# NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
# NEXTAUTH_URL=http://localhost:3000
# GITHUB_CLIENT_ID=<your GitHub OAuth app client ID>
# GITHUB_CLIENT_SECRET=<your GitHub OAuth app secret>
```

5. **Initialize database with seed data**
```bash
cd src/app/api/backend
python3 seed.py  # Creates database and populates with demo data
```

#### Running the Application

**Development Mode** (runs both frontend and backend):
```bash
# Terminal 1: Start backend
cd src/app/api/backend
source venv/bin/activate
python3 app.py

# Terminal 2: Start frontend
yarn dev
```

**Access the application:**
- Frontend: [http://localhost:3000](http://localhost:3000)
- GraphQL Playground: [http://localhost:8000/graphql](http://localhost:8000/graphql)

## 🎯 Try These Features!

Once the application is running, sign in with a demo account and explore:

### 1. **"For You" Personalized Recommendations** 🤖
- **Where:** Homepage after signing in
- **What it does:** ML-powered personalized product recommendations based on your purchase history
- **The tech:** Collaborative filtering using cosine similarity on user-item interaction matrices
- **Try it:** Sign in as `test@example.com` → see products tailored to that user's past purchases

### 2. **"You May Also Like" Smart Cart Suggestions** 🛒
- **Where:** Cart page after adding items
- **What it does:** Hybrid recommendation system combining collaborative + content-based filtering
- **The tech:** 60% collaborative filtering + 40% content-based, adjusted by Bayesian rating quality
- **Try it:** Add products to cart → scroll down to see intelligent recommendations

### 3. **Review System with Bayesian Quality Adjustment** ⭐
- **Where:** Any product detail page (click on a product)
- **What it does:** User reviews influence recommendations using statistically rigorous methods
- **The tech:** Wilson Score Interval (Lower Bound) for confidence-adjusted rating quality
- **Try it:** 
  - View a product → scroll to reviews section
  - Leave a review with rating
  - Watch how products with many bad reviews get penalized in recommendations
  - New products with no reviews? No penalty! (Solves cold-start problem)

### 4. **AI-Powered Ticket Generator** 🎫
- **Where:** Navigate to `/tickets` or click "Tickets" in header
- **What it does:** Generates development tickets with ML-based time estimates
- **The tech:** GitHub API integration + keyword complexity analysis + historical velocity
- **Try it:**
  - Connect GitHub account (OAuth)
  - Describe a task: "Add dark mode toggle to header"
  - Get ticket with estimated time, acceptance criteria, and similar historical tasks
  - Download as markdown file

### 5. **Smart Trending Products** 📈
- **Where:** Homepage (for logged-out users) or "For You" section fallback
- **What it does:** Shows popular products based on actual order frequency
- **The tech:** Aggregates order quantities across all users
- **Try it:** Sign out → homepage shows trending items

### 6. **Favorites & Wishlist** ❤️
- **Where:** Any product card (heart icon)
- **What it does:** Save products for later, influences recommendations
- **Try it:** Click heart on products → visit `/favorites` to see saved items

## 🐳 Docker Commands

If you're using Docker (recommended), here are useful commands:

```bash
# Start everything
./quickstart.sh

# Or manually:
docker compose up -d

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f backend
docker compose logs -f frontend

# Stop everything
docker compose down

# Stop and remove volumes (fresh start)
docker compose down -v

# Restart a service
docker compose restart backend

# Rebuild after code changes
docker compose up -d --build

# Run tests inside containers
docker compose exec frontend yarn test
docker compose exec backend pytest

# Access container shell
docker compose exec backend bash
docker compose exec frontend sh

# Check service status
docker compose ps
```

## 🧪 Testing

Run comprehensive test suites for both frontend and backend:

```bash
# Frontend tests (Jest + React Testing Library)
yarn test              # Run all tests
yarn test:watch        # Watch mode
yarn test:coverage     # With coverage report

# Backend tests (pytest)
yarn test:python              # Run all Python tests
yarn test:python:coverage     # With coverage report

# Run everything
yarn test:all

# In Docker
docker compose exec frontend yarn test
docker compose exec backend pytest -v
```

### Quick Setup for Ticket Generator

```bash
./setup-ticket-generator.sh
```

This automated script:
- Creates GitHub OAuth application
- Sets up environment variables
- Configures Python backend
- Tests the integration

## 📚 Documentation

Detailed documentation available in separate files:

- **[QUICKSTART.md](QUICKSTART.md)**: 60-second setup guide and troubleshooting
- **[FEATURES.md](FEATURES.md)**: Complete feature list (200+ features implemented)
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)**: Executive summary for technical assessment
- **[ARCHITECTURE.md](ARCHITECTURE.md)**: System architecture diagrams, data flow, algorithms, and database schema
- **[RECOMMENDATION-QUALITY-SYSTEM.md](RECOMMENDATION-QUALITY-SYSTEM.md)**: Deep dive into Bayesian rating quality system with mathematical explanations, implementation details, and examples
- **[FOR-YOU-IMPLEMENTATION.md](FOR-YOU-IMPLEMENTATION.md)**: Complete guide to personalized recommendation system, collaborative filtering algorithms, and cold-start strategies
- **[TICKET-GENERATOR-IMPLEMENTATION.md](TICKET-GENERATOR-IMPLEMENTATION.md)**: AI ticket generator architecture, ML estimation engine, and GitHub integration details
- **[TICKET-GENERATOR-SETUP.md](TICKET-GENERATOR-SETUP.md)**: Step-by-step setup instructions for GitHub OAuth and ticket generator
- **[TESTING.md](TESTING.md)**: Testing philosophy, coverage goals, and how to write tests
- **[WHAT-TESTS-DO.md](WHAT-TESTS-DO.md)**: Explanation of what each test suite validates

## 🧠 Machine Learning Algorithms Explained

### Collaborative Filtering (Item-Item Similarity)
1. Build user-item interaction matrix from order history
2. Calculate item-item similarity using cosine similarity
3. For products in user's cart, find similar products
4. Aggregate similarity scores across all cart items
5. Filter out already purchased/carted products
6. Return top-N most similar products

### Content-Based Filtering
1. Extract product features (category, attributes, metadata)
2. Create feature vectors for each product
3. Calculate product similarity based on shared features
4. Weight matches by feature importance (category > attributes > general metadata)
5. Return products with highest feature overlap

### Hybrid Recommendation Scoring
```
Hybrid Score = (0.6 × Collaborative Score) + (0.4 × Content Score)
Final Score = Hybrid Score × Quality Factor
```

### Wilson Score for Rating Quality
Provides statistically sound confidence intervals for ratings:
- Accounts for sample size (more reviews = more confidence)
- Asymmetric intervals (lower bound is more conservative)
- Used by Reddit, Yelp, Amazon for sorting by quality
- Prevents small samples from dominating rankings

## 🔬 Why This Project is Special

### Production-Ready ML
- Not toy algorithms—actual implementations used by major platforms
- Handles edge cases: cold start, sparse data, new users, missing ratings
- Statistically rigorous with Bayesian methods
- Explainable recommendations with score breakdowns

### Full-Stack Integration
- ML models integrated seamlessly with GraphQL API
- Real-time recommendations based on user actions
- Database-backed analytics and caching
- Type-safe communication between frontend and backend

### Developer Experience
- AI-powered development tools (ticket generator with ML estimation)
- Comprehensive testing (94%+ coverage)
- Modern tooling (Biome, TypeScript, pytest)
- Clear documentation and code organization

### Advanced Statistics
- Bayesian inference for rating quality
- Confidence intervals for decision-making
- Statistical significance testing before applying adjustments
- Mathematical rigor meets practical application

## 🎯 Use Cases & Applications

This project demonstrates skills relevant to:
- **E-commerce platforms**: Personalized shopping experiences
- **Recommendation systems**: Content discovery, product matching
- **Bayesian statistics**: Quality ranking, A/B testing, confidence modeling
- **Machine learning**: Collaborative filtering, content-based filtering, hybrid models
- **Full-stack development**: GraphQL APIs, modern React, Python backends
- **AI integration**: LLM-powered tools, GitHub automation, estimation algorithms
- **Software engineering**: Testing, documentation, code quality, architecture

## 📈 Future Enhancements

Potential extensions to explore:
- Matrix factorization for collaborative filtering (SVD, ALS)
- Deep learning recommendations (neural collaborative filtering)
- Multi-armed bandit algorithms for A/B testing
- Real-time stream processing for instant recommendations
- Graph databases for relationship-based recommendations
- Reinforcement learning for adaptive recommendation strategies
- Natural language processing for review sentiment analysis

## 📄 License

This project is an educational exercise demonstrating advanced full-stack development, machine learning, and statistical methods for e-commerce applications.

## 🙏 Acknowledgments

Built with modern technologies and inspired by production recommendation systems used at Amazon, Netflix, YouTube, and Reddit. Mathematical approaches based on academic research in collaborative filtering, Bayesian statistics, and information retrieval.

---

**Note**: This is a demonstration project showcasing advanced development skills, ML algorithms, and statistical methods. The focus is on education and technical excellence rather than production deployment.
