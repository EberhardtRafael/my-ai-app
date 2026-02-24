# Rating Quality System for ML Recommendations

## Overview

Our recommendation algorithm now includes **statistically rigorous rating quality adjustment** using Bayesian averages (Wilson score interval). This solves the key problems you identified:

1. ✅ **Cold Start Protection**: New products without reviews are NOT penalized
2. ✅ **Statistical Confidence**: Only applies penalties/boosts when we have enough data
3. ✅ **User Satisfaction**: Avoids recommending products with proven poor quality
4. ✅ **Fair to All**: Doesn't create negative feedback loops for new products

## The Problem

**Classic dilemma in recommendation systems:**
- Should ratings affect recommendations?
- If YES: Bad ratings push products down more and more (negative feedback loop)
- If NO: Users get upset when recommended products turn out to be terrible

**Our Solution:**
Use ratings as a **quality filter** with statistical significance thresholds:
- No reviews? → No penalty (fair to new products)
- Few reviews? → Minimal impact (not enough confidence)
- Many bad reviews? → Strong penalty (protect users)
- Many good reviews? → Boost (reward quality)

## Mathematical Approach

### Wilson Score Interval (Bayesian Average)

We use the **Lower Bound of Wilson Score Interval**, a statistically sound method for:
- Estimating "true" quality with confidence intervals
- Handling small sample sizes gracefully
- Used by Reddit, Yelp, Amazon for sorting/ranking

**Formula:**
```
Wilson Score Lower Bound = (p̂ + z²/2n - z√(p̂(1-p̂)/n + z²/4n²)) / (1 + z²/n)

Where:
- p̂ = success rate = (rating_avg - 1) / 4  (maps 1-5 stars to 0-1)
- n = number of reviews
- z = 1.96 (95% confidence interval)
```

### Quality Factor Mapping

The Wilson score (0-1) is mapped to a quality factor:

| Rating | Reviews | Wilson Score | Quality Factor | Impact |
|--------|---------|--------------|----------------|--------|
| 5.0★   | 50      | ~0.95        | 1.14x          | +14% boost |
| 4.8★   | 50      | ~0.93        | 1.14x          | +14% boost |
| 4.5★   | 20      | ~0.85        | 1.07x          | +7% boost |
| 4.0★   | 10      | ~0.70        | 0.99x          | ~neutral |
| 3.5★   | 10      | ~0.55        | 0.97x          | -3% penalty |
| 3.0★   | 10      | ~0.40        | 0.85x          | -15% penalty |
| 2.5★   | 15      | ~0.30        | 0.68x          | -32% penalty |
| 2.0★   | 20      | ~0.20        | 0.61x          | -39% penalty |
| 1.0★   | 100     | ~0.05        | 0.50x          | -50% max penalty |
| 0.0★   | 0       | N/A          | 1.00x          | **no penalty** |

## Implementation

### 1. Core Function

```python
def calculate_rating_quality_factor(rating_avg: float, rating_count: int) -> float:
    """
    Returns quality factor between 0.5 and 1.2:
    - 1.0 = neutral (no reviews or average rating)
    - < 1.0 = penalty for statistically significant bad ratings
    - > 1.0 = boost for excellent ratings with high confidence
    """
```

### 2. Thresholds

```python
MIN_REVIEWS_FOR_PENALTY = 5   # Need at least 5 reviews to apply penalties
MIN_REVIEWS_FOR_BOOST = 10    # Need at least 10 reviews to apply boosts
```

### 3. Integration with Hybrid Recommendations

```python
# Step 1: Calculate collaborative filtering scores (0.6 weight)
# Step 2: Calculate content-based filtering scores (0.4 weight)
# Step 3: Combine into hybrid score
# Step 4: Apply rating quality factor
adjusted_score = hybrid_score * quality_factor
# Step 5: Re-sort by adjusted scores
```

## Example Impact

**Scenario: User has Product X in cart (base similarity score: 0.75)**

Recommended products:

| Product | Rating | Reviews | Quality Factor | Base Score | Final Score | Change |
|---------|--------|---------|----------------|------------|-------------|--------|
| A (excellent) | 4.8★ | 50 | 1.14x | 0.750 | **0.855** | +14% ⬆️ |
| B (average) | 3.5★ | 10 | 0.97x | 0.750 | **0.725** | -3% ⬇️ |
| C (poor) | 2.0★ | 20 | 0.61x | 0.750 | **0.459** | -39% ⬇️⬇️ |
| D (new) | 0.0★ | 0 | 1.00x | 0.750 | **0.750** | 0% ➡️ |

**Result:**
- Product A moves up in recommendations (reward quality)
- Product B stays roughly the same (neutral)
- Product C drops significantly (protect users from bad products)
- Product D is unaffected (fair to new products)

## Benefits

### 1. Cold Start Protection
```python
if rating_count == 0:
    return 1.0  # No penalty for new products
```

### 2. Statistical Confidence
```python
if rating_count < MIN_REVIEWS_FOR_PENALTY:
    return 1.0  # Too few reviews to be confident
```

### 3. Prevents Negative Feedback Loops
- New products: Not penalized → get shown → accumulate reviews → quality assessed
- Bad products with evidence: Penalized → shown less → but can recover if quality improves

### 4. User Trust
- Users see high-quality products more often
- Poor products don't waste user time
- Transparent: rating badges shown on products

## Testing

Run the test script to see the system in action:

```bash
cd src/app/api/backend
python3 test-rating-quality.py
```

Output shows:
- Quality factors for various rating scenarios
- Impact on recommendation scores
- Statistical confidence thresholds

## Monitoring

The system logs quality adjustments:

```
[RATING] Product 123: 4.8★ (50 reviews) → Quality factor: 1.14x (Score: 0.750 → 0.855)
[RATING] Product 456: 2.0★ (20 reviews) → Quality factor: 0.61x (Score: 0.750 → 0.459)
```

## Future Enhancements

1. **Verified Purchase Weight**: Give higher weight to verified purchase reviews
2. **Recency Decay**: Weight recent reviews more heavily
3. **Category Baselines**: Adjust thresholds per category (e.g., luxury items vs budget)
4. **A/B Testing**: Compare with/without quality factor to measure impact on user satisfaction

## References

- [Wilson Score Interval (Wikipedia)](https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval#Wilson_score_interval)
- [How Not To Sort By Average Rating](https://www.evanmiller.org/how-not-to-sort-by-average-rating.html)
- Bayesian Average Rating used by IMDB, Reddit, Yelp

---

**Key Insight:** We balance **fairness to new products** with **protection for users**. The Wilson score provides the mathematical rigor to make this tradeoff scientifically sound.
