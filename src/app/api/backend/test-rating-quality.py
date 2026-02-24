#!/usr/bin/env python3
"""
Test the rating quality factor calculation.
Shows how ratings affect recommendation scores with statistical rigor.
"""

import numpy as np
from recommendations import calculate_rating_quality_factor

print("=" * 80)
print("RATING QUALITY FACTOR - Bayesian Average (Wilson Score)")
print("=" * 80)
print("\nHow it works:")
print("- Cold start: No reviews = 1.0x (neutral, no penalty)")
print("- Statistical significance: Need 5+ reviews for penalties, 10+ for boosts")
print("- Confidence interval: Uses Wilson score (95% confidence)")
print("- Fair to new products: Won't penalize until enough evidence exists")
print("\n" + "=" * 80 + "\n")

test_cases = [
    # (rating_avg, rating_count, description)
    (0.0, 0, "No reviews (cold start)"),
    (5.0, 1, "Perfect rating, but only 1 review (not enough data)"),
    (5.0, 3, "Perfect rating, 3 reviews (still not enough)"),
    (5.0, 10, "Perfect rating, 10 reviews (HIGH CONFIDENCE BOOST)"),
    (4.8, 50, "Excellent rating, 50 reviews (STRONG BOOST)"),
    (4.5, 20, "Very good rating, 20 reviews (moderate boost)"),
    (4.0, 10, "Good rating, 10 reviews (neutral to slight boost)"),
    (3.8, 8, "Above average, 8 reviews (neutral)"),
    (3.5, 10, "Average rating, 10 reviews (neutral)"),
    (3.2, 10, "Below average, 10 reviews (PENALTY starts)"),
    (2.5, 15, "Poor rating, 15 reviews (STRONG PENALTY)"),
    (2.0, 20, "Bad rating, 20 reviews (HEAVY PENALTY)"),
    (1.5, 30, "Terrible rating, 30 reviews (MAX PENALTY)"),
    (1.0, 5, "Worst rating, 5 reviews (penalty applies)"),
    (1.0, 100, "Worst rating, 100 reviews (MAX PENALTY with confidence)"),
]

print("Test Cases:")
print("-" * 80)

for rating_avg, rating_count, description in test_cases:
    quality_factor = calculate_rating_quality_factor(rating_avg, rating_count)
    
    # Determine impact
    if quality_factor > 1.05:
        impact = "✅ BOOST"
        color = "\033[92m"  # Green
    elif quality_factor < 0.95:
        impact = "❌ PENALTY"
        color = "\033[91m"  # Red
    else:
        impact = "➖ NEUTRAL"
        color = "\033[93m"  # Yellow
    
    reset = "\033[0m"
    
    print(f"{color}{impact:12}{reset} | "
          f"Rating: {rating_avg:.1f}★ ({rating_count:3d} reviews) | "
          f"Factor: {quality_factor:.2f}x | "
          f"{description}")

print("\n" + "=" * 80)
print("\nExample: Recommendation Score Impact")
print("-" * 80)

# Simulate recommendation scores
base_score = 0.75  # Base similarity score from collaborative filtering

example_products = [
    ("Product A", 4.8, 50, "Excellent product"),
    ("Product B", 3.5, 10, "Average product"),
    ("Product C", 2.0, 20, "Poor product"),
    ("Product D", 0.0, 0, "New product (no reviews yet)"),
]

print(f"\nBase recommendation score: {base_score:.3f}\n")

for name, rating_avg, rating_count, desc in example_products:
    quality_factor = calculate_rating_quality_factor(rating_avg, rating_count)
    adjusted_score = base_score * quality_factor
    
    change = ((adjusted_score - base_score) / base_score) * 100
    
    print(f"{name:12} | {rating_avg:.1f}★ ({rating_count:2d}) | "
          f"Factor: {quality_factor:.2f}x | "
          f"Score: {base_score:.3f} → {adjusted_score:.3f} "
          f"({change:+.1f}%) | {desc}")

print("\n" + "=" * 80)
print("\n✅ Key Insights:")
print("   - Products without reviews are NOT penalized (fair to new items)")
print("   - Need 5+ reviews before applying penalties (statistical confidence)")
print("   - Need 10+ reviews for boosts (even more confidence required)")
print("   - Excellent products (4.5+★ with many reviews) get boosted")
print("   - Poor products (<3.5★ with evidence) get penalized")
print("   - Uses Wilson score for conservative, statistically sound estimates")
print("\n" + "=" * 80 + "\n")
