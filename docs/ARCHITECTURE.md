# Architecture Overview

## System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         User Browser                           │
│                     http://localhost:3000                      │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (Port 3000)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  App Router (Next.js 15.5)                               │  │
│  │  - /              → Personalized "For You"               │  │
│  │  - /plp           → Product Listing                      │  │
│  │  - /pdp/:id       → Product Details + Reviews            │  │
│  │  - /cart          → Cart + Recommendations               │  │
│  │  - /assistant     → Shopping Assistant                   │  │
│  │  - /tickets       → AI Ticket Generator                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Context Providers                                       │  │
│  │  - CartContext          → Global cart state              │  │
│  │  - FavoritesContext     → Wishlist management            │  │
│  │  - LocalizationContext  → i18n & translations            │  │
│  │  - SessionWrapper       → NextAuth integration           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             │ GraphQL/REST
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                   Python Flask Backend (Port 8000)             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  GraphQL API (Strawberry)                                │  │
│  │  - /graphql       → Main API endpoint                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ML Recommendation Engine                                │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Collaborative Filtering (60%)                     │  │  │
│  │  │  - User-item interaction matrix                    │  │  │
│  │  │  - Cosine similarity                               │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Content-Based Filtering (40%)                     │  │  │
│  │  │  - Category matching                               │  │  │
│  │  │  - Attribute similarity                            │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Bayesian Quality Adjustment                       │  │  │
│  │  │  - Wilson Score Interval                           │  │  │
│  │  │  - Rating confidence calculation                   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AI Ticket Generator                                     │  │
│  │  - GitHub API client with caching                        │  │
│  │  - ML-based time estimation                              │  │
│  │  - Similarity matching for historical tasks              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Database Layer (SQLite)                                 │  │
│  │  - Products & Variants                                   │  │
│  │  - Users & Authentication                                │  │
│  │  - Orders & Cart Items                                   │  │
│  │  - Reviews & Ratings                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │  External APIs     │
                    │  - GitHub OAuth    │
                    │  - GitHub REST API │
                    └────────────────────┘
```

## Data Flow Examples

### 1. Personalized Recommendations (Homepage)

```
User visits homepage
       │
       ▼
Next.js fetches user session (NextAuth)
       │
       ▼
GraphQL query: personalizedRecommendations(userId)
       │
       ▼
Backend: get_personalized_recommendations()
       │
       ├─→ Has purchase history?
       │   └─→ Collaborative filtering
       │       - Build user-item matrix from orders
       │       - Calculate product similarities
       │       - Exclude already purchased
       │
       ├─→ Only has favorites?
       │   └─→ Category-based recommendations
       │
       └─→ New user?
           └─→ Trending products (order frequency)
       │
       ▼
Return top 8 products
       │
       ▼
Frontend displays "For You" section
```

### 2. Cart Recommendations with Quality Adjustment

```
User views cart
       │
       ▼
GraphQL query: recommendations(userId)
       │
       ▼
Backend: get_hybrid_recommendations()
       │
       ├─→ Collaborative Filtering (60%)
       │   - Find similar products to cart items
       │   - Score based on user purchase patterns
       │
       ├─→ Content-Based Filtering (40%)
       │   - Match categories and attributes
       │   - Score by feature overlap
       │
       └─→ Combine scores (weighted average)
       │
       ▼
Apply Bayesian quality adjustment
       │
       ├─→ Fetch product ratings from database
       │
       ├─→ Calculate Wilson Score for each product
       │   Formula: (p̂ + z²/2n - z√(...)) / (1 + z²/n)
       │
       ├─→ Map to quality factor (0.5x to 1.2x)
       │   - New products: 1.0x (no penalty)
       │   - Few reviews: minimal impact
       │   - Many bad reviews: strong penalty
       │   - Many good reviews: boost
       │
       └─→ Multiply: final_score = hybrid_score × quality_factor
       │
       ▼
Sort by adjusted scores
       │
       ▼
Return top 5 recommendations
       │
       ▼
Display "You May Also Like" section
```

### 3. AI Ticket Generation

```
User describes task on /tickets page
       │
       ▼
Frontend: POST /api/tickets/generate
       │
       ▼
Backend: connect to GitHub API
       │
       ├─→ Fetch repository metadata
       ├─→ Fetch branch history
       ├─→ Fetch PR statistics
       └─→ Cache results (SQLite)
       │
       ▼
ML Time Estimation Engine
       │
       ├─→ Analyze description for complexity keywords
       │   (auth, API, database, etc.)
       │   
       ├─→ Calculate scope from length/detail
       │
       ├─→ Adjust for historical velocity
       │   (team's average completion times)
       │
       └─→ Apply context multiplier
           (frontend/backend/full-stack)
       │
       ▼
Find similar historical tasks
       │
       └─→ Extract keywords from description
       └─→ Calculate Jaccard similarity
       └─→ Return top 3 matches with actual times
       │
       ▼
Generate ticket markdown
       │
       ├─→ User story format
       ├─→ Acceptance criteria (checkboxes)
       ├─→ Technical notes
       ├─→ Time estimate breakdown
       └─→ Similar task references
       │
       ▼
Return formatted ticket to frontend
       │
       ▼
User can download as .md file
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Auth**: NextAuth.js
- **i18n**: next-intl (internationalization)
- **State**: React Context API (Cart, Favorites, Session, Localization)
- **Testing**: Jest + React Testing Library
- **Linting**: Biome (ESLint/Prettier replacement)

### Backend
- **Framework**: Flask
- **Language**: Python 3.11+
- **API**: Strawberry GraphQL
- **Database**: SQLite
- **ML Libraries**: NumPy, scikit-learn
- **Testing**: pytest
- **External APIs**: GitHub REST API

### DevOps
- **Containerization**: Docker + Docker Compose
- **Development**: Hot reload for both frontend/backend
- **Scripts**: Automated setup and quickstart
- **CI/CD Ready**: Test suites with coverage reporting

## Key Algorithms

### Collaborative Filtering (Item-Item Similarity)
```python
1. Build user-item interaction matrix from order history
2. For each product in user's cart:
   - Calculate cosine similarity with all other products
   - Score = similarity × interaction_strength
3. Aggregate scores across all cart items
4. Filter out already purchased/carted items
5. Return top-N most similar products
```

### Wilson Score (Bayesian Rating Quality)
```python
1. Convert rating (1-5 stars) to proportion (0-1)
   p̂ = (rating_avg - 1) / 4

2. Calculate Wilson Score Lower Bound
   wilson = (p̂ + z²/2n - z√(p̂(1-p̂)/n + z²/4n²)) / (1 + z²/n)
   where z = 1.96 (95% confidence)

3. Map to quality factor
   if reviews < 5: factor = 1.0 (no penalty)
   elif wilson < 0.4: factor = 0.5 - 0.85 (penalty)
   elif wilson > 0.8: factor = 1.05 - 1.2 (boost)
   else: factor = 0.95 - 1.05 (near neutral)

4. Apply to recommendation score
   final_score = base_score × quality_factor
```

### ML Time Estimation
```python
1. Base estimate (by type)
   - Frontend: 5 hours
   - Backend: 8 hours
   - Full-stack: 12 hours

2. Complexity multiplier (keyword analysis)
   - "authentication": 1.5x
   - "API integration": 1.3x
   - "database": 1.4x
   - "testing": 1.2x
   - etc.

3. Scope multiplier (description analysis)
   - Short (< 100 chars): 0.8x
   - Medium (100-300): 1.0x
   - Detailed (> 300): 1.2x

4. Historical adjustment (team velocity)
   - Avg actual / avg estimated
   - Typical range: 0.9x - 1.2x

Final estimate = base × complexity × scope × historical
```

## Database Schema (Simplified)

```sql
-- Products
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT,
    category TEXT,
    price REAL,
    material TEXT,
    tags TEXT
);

-- Variants
CREATE TABLE variants (
    id INTEGER PRIMARY KEY,
    product_id INTEGER,
    sku TEXT,
    color TEXT,
    size TEXT,
    stock INTEGER,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Users
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT
);

-- Orders
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    product_id INTEGER,
    variant_id INTEGER,
    quantity INTEGER,
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Reviews
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    product_id INTEGER,
    rating INTEGER,
    comment TEXT,
    helpful_count INTEGER,
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Cart
CREATE TABLE cart_items (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    product_id INTEGER,
    variant_id INTEGER,
    quantity INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Favorites
CREATE TABLE favorites (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    product_id INTEGER,
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```
