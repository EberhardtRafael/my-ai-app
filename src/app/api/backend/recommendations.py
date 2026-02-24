"""
Machine Learning Product Recommendations
Uses collaborative filtering with scikit-learn to suggest products
based on user purchase patterns and current cart items.
"""

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import joinedload
from models import Order, OrderItem, Product, Favorite, Session
from typing import List, Dict


def build_user_item_matrix() -> pd.DataFrame:
    """
    Build a user-item interaction matrix from order history.
    Rows: users, Columns: products, Values: number of times user purchased product
    """
    # Create a new session for this request
    db_session = Session()
    try:
        # Get all completed orders (not carts)
        orders = db_session.query(Order).filter(Order.status != "cart").all()
        
        # Build list of interactions
        interactions = []
        for order in orders:
            for item in order.items:
                interactions.append({
                    'user_id': order.user_id,
                    'product_id': item.product_id,
                    'quantity': item.quantity
                })
        
        # Convert to DataFrame
        df = pd.DataFrame(interactions)
        
        if df.empty:
            # Return empty matrix if no orders exist
            return pd.DataFrame()
        
        # Create pivot table (user-item matrix)
        # Rows: users, Columns: products, Values: sum of quantities purchased
        user_item_matrix = df.pivot_table(
            index='user_id',
            columns='product_id',
            values='quantity',
            aggfunc='sum',
            fill_value=0
        )
        
        return user_item_matrix
    finally:
        db_session.close()


def calculate_item_similarity(user_item_matrix: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate item-item similarity using cosine similarity.
    This measures how similar products are based on which users bought them.
    
    Cosine similarity ranges from 0 (no similarity) to 1 (identical purchase patterns)
    """
    if user_item_matrix.empty:
        return pd.DataFrame()
    
    # Transpose to get item-user matrix (items as rows)
    item_user_matrix = user_item_matrix.T
    
    # Calculate cosine similarity between all pairs of items
    # This creates a matrix where similarity[i][j] = similarity between product i and j
    similarity_matrix = cosine_similarity(item_user_matrix)
    
    # Convert to DataFrame for easier handling
    similarity_df = pd.DataFrame(
        similarity_matrix,
        index=item_user_matrix.index,
        columns=item_user_matrix.index
    )
    
    return similarity_df


def get_recommendations_for_items(
    product_ids: List[int],
    similarity_df: pd.DataFrame,
    n_recommendations: int = 5,
    exclude_product_ids: List[int] = None
) -> List[Dict]:
    """
    Get product recommendations based on items in cart using collaborative filtering.
    
    Args:
        product_ids: List of product IDs in user's cart
        similarity_df: Pre-calculated item similarity matrix
        n_recommendations: Number of recommendations to return
        exclude_product_ids: Product IDs to exclude (e.g., already in cart)
    
    Returns:
        List of recommended product IDs with similarity scores
    """
    if similarity_df.empty or not product_ids:
        return []
    
    exclude_product_ids = exclude_product_ids or []
    
    # For each product in cart, get similar products
    recommendations_scores = {}
    
    for product_id in product_ids:
        if product_id not in similarity_df.index:
            continue
        
        # Get similarity scores for this product
        similar_items = similarity_df[product_id].sort_values(ascending=False)
        
        # Aggregate scores (sum similarity for products recommended by multiple cart items)
        for similar_product_id, similarity_score in similar_items.items():
            # Skip the product itself
            if similar_product_id == product_id:
                continue
            
            # Skip excluded products
            if similar_product_id in exclude_product_ids:
                continue
            
            # Aggregate scores
            if similar_product_id in recommendations_scores:
                recommendations_scores[similar_product_id] += similarity_score
            else:
                recommendations_scores[similar_product_id] = similarity_score
    
    # Sort by aggregated similarity score
    sorted_recommendations = sorted(
        recommendations_scores.items(),
        key=lambda x: x[1],
        reverse=True
    )
    
    # Return top N recommendations
    return [
        {'product_id': int(product_id), 'score': float(score)}
        for product_id, score in sorted_recommendations[:n_recommendations]
    ]


def get_cart_recommendations(user_id: int, limit: int = 5) -> List[Product]:
    """
    Main function to get product recommendations for user's cart.
    Uses collaborative filtering based on:
    - Current cart items (highest weight)
    - User's past order history (medium weight)
    - User's favorite products (lower weight)
    
    Args:
        user_id: User ID to get recommendations for
        limit: Maximum number of recommendations to return
    
    Returns:
        List of recommended Product objects
    """
    # Create a new session for this request
    db_session = Session()
    try:
        # Get user's current cart
        cart = db_session.query(Order).filter(
            Order.user_id == user_id,
            Order.status == "cart"
        ).first()
        
        if not cart or not cart.items:
            # No cart or empty cart - can't make recommendations
            return []
        
        # Extract product IDs from cart
        cart_product_ids = [item.product_id for item in cart.items]
        
        # Get user's past order history (completed orders)
        past_orders = db_session.query(Order).filter(
            Order.user_id == user_id,
            Order.status != "cart"
        ).all()
        past_order_product_ids = []
        for order in past_orders:
            past_order_product_ids.extend([item.product_id for item in order.items])
        past_order_product_ids = list(set(past_order_product_ids))  # Remove duplicates
        
        # Get user's favorite products
        favorites = db_session.query(Favorite).filter(
            Favorite.user_id == user_id,
            Favorite.removed_at.is_(None)
        ).all()
        favorite_product_ids = [fav.product_id for fav in favorites]
        
        # Combine all context for better recommendations
        # Weight: cart items heavily, past orders moderately, favorites lightly
        context_product_ids = cart_product_ids + past_order_product_ids + favorite_product_ids
        context_product_ids = list(set(context_product_ids))  # Remove duplicates
        
        # Items to exclude from recommendations (already in cart)
        exclude_product_ids = cart_product_ids
        
        # Build user-item matrix from all order history
        user_item_matrix = build_user_item_matrix()
        
        print(f"[DEBUG] User {user_id} - Cart products: {cart_product_ids}")
        print(f"[DEBUG] User {user_id} - Past order products: {past_order_product_ids}")
        print(f"[DEBUG] User {user_id} - Favorite products: {favorite_product_ids}")
        print(f"[DEBUG] User {user_id} - Context products: {context_product_ids}")
        print(f"[DEBUG] User {user_id} - Matrix shape: {user_item_matrix.shape if not user_item_matrix.empty else 'empty'}")
        
        if user_item_matrix.empty:
            # Not enough data for collaborative filtering
            # Fall back to category-based recommendations
            print(f"[DEBUG] User {user_id} - Using fallback (empty matrix)")
            return get_fallback_recommendations(cart_product_ids, limit, db_session)
        
        # Calculate item similarity matrix
        similarity_df = calculate_item_similarity(user_item_matrix)
        
        # Get recommendations based on all context (cart + past orders + favorites)
        recommendations = get_recommendations_for_items(
            product_ids=context_product_ids,
            similarity_df=similarity_df,
            n_recommendations=limit * 2,  # Get extra to filter out unavailable
            exclude_product_ids=exclude_product_ids  # Don't recommend items already in cart
        )
        
        print(f"[DEBUG] User {user_id} - Collaborative filtering found {len(recommendations)} recommendations")
        
        # If collaborative filtering found too few recommendations (less than limit),
        # blend with fallback recommendations to fill the gap
        if len(recommendations) < limit:
            print(f"[DEBUG] User {user_id} - Blending with fallback (only {len(recommendations)} CF recommendations)")
            
            # Get collaborative filtering results
            cf_product_ids = [rec['product_id'] for rec in recommendations] if recommendations else []
            cf_products = db_session.query(Product).options(
                joinedload(Product.variants)
            ).filter(
                Product.id.in_(cf_product_ids)
            ).all() if cf_product_ids else []
            
            # Get fallback recommendations, excluding already recommended products
            fallback_limit = limit - len(cf_products)
            exclude_ids = cart_product_ids + cf_product_ids
            fallback_products = get_fallback_recommendations(
                cart_product_ids=cart_product_ids,
                limit=fallback_limit,
                db_session=db_session,
                exclude_product_ids=exclude_ids
            )
            
            # Combine both lists
            combined_products = cf_products + fallback_products
            print(f"[DEBUG] User {user_id} - Returning {len(combined_products)} products ({len(cf_products)} CF + {len(fallback_products)} fallback)")
            return combined_products[:limit]
        
        # Enough collaborative filtering recommendations
        recommended_product_ids = [rec['product_id'] for rec in recommendations]
        print(f"[DEBUG] User {user_id} - Fetching {len(recommended_product_ids)} products, limit={limit}")
        products = db_session.query(Product).options(
            joinedload(Product.variants)
        ).filter(
            Product.id.in_(recommended_product_ids)
        ).limit(limit).all()
        
        print(f"[DEBUG] User {user_id} - Returning {len(products)} products")
        return products
    finally:
        db_session.close()


def get_fallback_recommendations(cart_product_ids: List[int], limit: int, db_session=None, exclude_product_ids: List[int] = None) -> List[Product]:
    """
    Fallback recommendations when not enough order history exists.
    Returns products from same categories as cart items.
    
    Args:
        cart_product_ids: Product IDs currently in cart (used to get categories)
        limit: Maximum number of recommendations to return
        db_session: Optional database session to reuse
        exclude_product_ids: Additional product IDs to exclude from recommendations
    """
    # Use provided session or create a new one
    should_close = False
    if db_session is None:
        db_session = Session()
        should_close = True
    
    # Combine all products to exclude
    all_exclude_ids = list(set((exclude_product_ids or []) + cart_product_ids))
    
    try:
        # Get categories of products in cart
        cart_products = db_session.query(Product).filter(
            Product.id.in_(cart_product_ids)
        ).all()
        
        cart_categories = list(set([p.category for p in cart_products]))
        
        print(f"[DEBUG] Fallback - Cart product IDs: {cart_product_ids}")
        print(f"[DEBUG] Fallback - Exclude product IDs: {all_exclude_ids}")
        print(f"[DEBUG] Fallback - Cart categories: {cart_categories}")
        print(f"[DEBUG] Fallback - Limit: {limit}")
        
        if not cart_categories:
            return []
        
        # Get products from same categories, excluding specified items
        recommended_products = db_session.query(Product).options(
            joinedload(Product.variants)
        ).filter(
            Product.category.in_(cart_categories),
            ~Product.id.in_(all_exclude_ids)
        ).limit(limit).all()
        
        print(f"[DEBUG] Fallback - Found {len(recommended_products)} recommendations")
        
        return recommended_products
    finally:
        if should_close:
            db_session.close()
