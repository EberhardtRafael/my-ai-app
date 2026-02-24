"""
Machine Learning Product Recommendations
Combines collaborative filtering and content-based filtering:
- Collaborative: Based on user purchase patterns (who bought what together)
- Content-based: Based on product attributes (description, tags, material, brand)
"""

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
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


def build_content_similarity_matrix(product_ids: List[int] = None) -> pd.DataFrame:
    """
    Calculate content-based similarity using TF-IDF on product attributes.
    Combines description, tags, material, and brand into feature vectors.
    
    Args:
        product_ids: Optional list of product IDs to analyze. If None, analyzes all products.
    
    Returns:
        DataFrame with product similarity scores based on content
    """
    db_session = Session()
    try:
        # Fetch products with their attributes
        query = db_session.query(Product)
        if product_ids:
            query = query.filter(Product.id.in_(product_ids))
        products = query.all()
        
        if not products:
            return pd.DataFrame()
        
        # Build text corpus for each product
        product_texts = []
        product_ids_list = []
        
        for product in products:
            # Combine all text features
            text_parts = []
            
            if product.description:
                text_parts.append(product.description)
            if product.tags:
                text_parts.append(product.tags.replace(',', ' '))
            if product.material:
                # Repeat material multiple times for higher weight
                text_parts.append(f"{product.material} {product.material} {product.material}")
            if product.brand:
                # Repeat brand for higher weight
                text_parts.append(f"{product.brand} {product.brand}")
            if product.category:
                # Category is very important
                text_parts.append(f"{product.category} {product.category} {product.category}")
            
            combined_text = ' '.join(text_parts)
            product_texts.append(combined_text)
            product_ids_list.append(product.id)
        
        # Create TF-IDF vectors
        vectorizer = TfidfVectorizer(
            max_features=200,
            stop_words='english',
            ngram_range=(1, 2)  # Use both single words and pairs
        )
        
        tfidf_matrix = vectorizer.fit_transform(product_texts)
        
        # Calculate cosine similarity
        similarity_matrix = cosine_similarity(tfidf_matrix)
        
        # Convert to DataFrame
        similarity_df = pd.DataFrame(
            similarity_matrix,
            index=product_ids_list,
            columns=product_ids_list
        )
        
        return similarity_df
        
    finally:
        db_session.close()


def get_hybrid_recommendations(
    cart_product_ids: List[int],
    collaborative_similarity: pd.DataFrame,
    limit: int = 5,
    exclude_product_ids: List[int] = None
) -> List[Dict]:
    """
    Hybrid recommendation combining collaborative and content-based filtering.
    
    Args:
        cart_product_ids: Products currently in cart
        collaborative_similarity: Pre-calculated collaborative filtering similarity matrix
        limit: Number of recommendations to return
        exclude_product_ids: Products to exclude from results
    
    Returns:
        List of recommended product IDs with hybrid scores
    """
    exclude_product_ids = exclude_product_ids or []
    
    # Get content-based similarity for cart products
    content_similarity = build_content_similarity_matrix()
    
    recommendations_scores = {}
    
    # Weight factors (tune these for better results)
    COLLABORATIVE_WEIGHT = 0.6
    CONTENT_WEIGHT = 0.4
    
    for product_id in cart_product_ids:
        # Collaborative filtering scores
        if not collaborative_similarity.empty and product_id in collaborative_similarity.index:
            cf_scores = collaborative_similarity[product_id]
            
            for similar_product_id, cf_score in cf_scores.items():
                if similar_product_id == product_id or similar_product_id in exclude_product_ids:
                    continue
                
                # Initialize score if not exists
                if similar_product_id not in recommendations_scores:
                    recommendations_scores[similar_product_id] = {'cf': 0.0, 'content': 0.0}
                
                recommendations_scores[similar_product_id]['cf'] += cf_score
        
        # Content-based filtering scores
        if not content_similarity.empty and product_id in content_similarity.index:
            content_scores = content_similarity[product_id]
            
            for similar_product_id, content_score in content_scores.items():
                if similar_product_id == product_id or similar_product_id in exclude_product_ids:
                    continue
                
                # Initialize score if not exists
                if similar_product_id not in recommendations_scores:
                    recommendations_scores[similar_product_id] = {'cf': 0.0, 'content': 0.0}
                
                recommendations_scores[similar_product_id]['content'] += content_score
    
    # Calculate hybrid scores
    hybrid_scores = {}
    for product_id, scores in recommendations_scores.items():
        hybrid_score = (
            scores['cf'] * COLLABORATIVE_WEIGHT +
            scores['content'] * CONTENT_WEIGHT
        )
        hybrid_scores[product_id] = hybrid_score
    
    # Sort by hybrid score
    sorted_recommendations = sorted(
        hybrid_scores.items(),
        key=lambda x: x[1],
        reverse=True
    )
    
    return [
        {'product_id': int(product_id), 'score': float(score)}
        for product_id, score in sorted_recommendations[:limit]
    ]


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
        
        # Calculate item similarity matrix (collaborative filtering)
        similarity_df = calculate_item_similarity(user_item_matrix)
        
        # Use hybrid recommendations (collaborative + content-based)
        print(f"[DEBUG] User {user_id} - Using hybrid recommendations (CF + content-based)")
        recommendations = get_hybrid_recommendations(
            cart_product_ids=cart_product_ids,
            collaborative_similarity=similarity_df,
            limit=limit * 2,  # Get extra to filter out unavailable
            exclude_product_ids=exclude_product_ids
        )
        
        print(f"[DEBUG] User {user_id} - Hybrid filtering found {len(recommendations)} recommendations")
        
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


def get_personalized_recommendations(user_id: int, limit: int = 8) -> List[Product]:
    """
    Get personalized product recommendations for homepage "For You" section.
    Uses collaborative filtering based on user's browsing/purchase history.
    Falls back to trending/popular products for new users with no history.
    
    Strategy:
    1. For users with order history: Use collaborative filtering based on past purchases
    2. For users with favorites only: Recommend similar products to favorites
    3. For new users: Show trending products (most ordered across all users)
    
    Args:
        user_id: User ID to get recommendations for
        limit: Maximum number of recommendations to return (default: 8 for homepage)
    
    Returns:
        List of recommended Product objects
    """
    db_session = Session()
    try:
        # Get user's purchase history (completed orders)
        past_orders = db_session.query(Order).filter(
            Order.user_id == user_id,
            Order.status != "cart"
        ).all()
        
        # Collect all products user has purchased
        purchased_product_ids = []
        for order in past_orders:
            purchased_product_ids.extend([item.product_id for item in order.items])
        purchased_product_ids = list(set(purchased_product_ids))  # Remove duplicates
        
        # Get user's favorites
        favorites = db_session.query(Favorite).filter(
            Favorite.user_id == user_id,
            Favorite.removed_at.is_(None)
        ).all()
        favorite_product_ids = [fav.product_id for fav in favorites]
        
        print(f"[DEBUG] Personalized - User {user_id} has {len(purchased_product_ids)} purchased products")
        print(f"[DEBUG] Personalized - User {user_id} has {len(favorite_product_ids)} favorites")
        
        # Strategy 1: User has purchase history - use collaborative filtering
        if purchased_product_ids:
            print(f"[DEBUG] Personalized - Using collaborative filtering for user {user_id}")
            
            # Build user-item matrix
            user_item_matrix = build_user_item_matrix()
            
            if not user_item_matrix.empty:
                # Calculate item similarity
                similarity_df = calculate_item_similarity(user_item_matrix)
                
                # Get recommendations based on purchase history
                # Combine purchased products and favorites for better context
                context_product_ids = list(set(purchased_product_ids + favorite_product_ids))
                
                recommendations = get_recommendations_for_items(
                    product_ids=context_product_ids,
                    similarity_df=similarity_df,
                    n_recommendations=limit * 2,  # Get extra to filter
                    exclude_product_ids=purchased_product_ids  # Don't recommend already purchased
                )
                
                if recommendations:
                    recommended_product_ids = [rec['product_id'] for rec in recommendations[:limit]]
                    products = db_session.query(Product).options(
                        joinedload(Product.variants)
                    ).filter(
                        Product.id.in_(recommended_product_ids)
                    ).all()
                    
                    # Sort products to match recommendation order
                    product_dict = {p.id: p for p in products}
                    sorted_products = [product_dict[pid] for pid in recommended_product_ids if pid in product_dict]
                    
                    print(f"[DEBUG] Personalized - Returning {len(sorted_products)} CF recommendations")
                    return sorted_products
        
        # Strategy 2: User has favorites but no purchases - recommend similar to favorites
        if favorite_product_ids:
            print(f"[DEBUG] Personalized - Using favorites-based recommendations for user {user_id}")
            
            # Get categories from favorite products
            favorite_products = db_session.query(Product).filter(
                Product.id.in_(favorite_product_ids)
            ).all()
            favorite_categories = list(set([p.category for p in favorite_products]))
            
            # Recommend popular products from same categories
            recommendations = db_session.query(Product).options(
                joinedload(Product.variants)
            ).filter(
                Product.category.in_(favorite_categories),
                ~Product.id.in_(favorite_product_ids)  # Exclude favorites
            ).limit(limit).all()
            
            print(f"[DEBUG] Personalized - Returning {len(recommendations)} category-based recommendations")
            return recommendations
        
        # Strategy 3: New user with no history - show trending/popular products
        print(f"[DEBUG] Personalized - Using trending products for new user {user_id}")
        trending_products = get_trending_products(limit, db_session)
        print(f"[DEBUG] Personalized - Returning {len(trending_products)} trending products")
        return trending_products
        
    finally:
        db_session.close()


def get_trending_products(limit: int, db_session=None) -> List[Product]:
    """
    Get trending/popular products based on order frequency.
    Used as fallback for new users or when personalization isn't possible.
    
    Args:
        limit: Maximum number of products to return
        db_session: Optional database session to reuse
    
    Returns:
        List of Product objects sorted by popularity
    """
    should_close = False
    if db_session is None:
        db_session = Session()
        should_close = True
    
    try:
        # Get products ordered by total quantity sold (from completed orders)
        from sqlalchemy import func
        
        popular_products = db_session.query(
            Product,
            func.sum(OrderItem.quantity).label('total_sold')
        ).join(
            OrderItem, Product.id == OrderItem.product_id
        ).join(
            Order, OrderItem.order_id == Order.id
        ).filter(
            Order.status != "cart"  # Only count completed orders
        ).options(
            joinedload(Product.variants)
        ).group_by(Product.id).order_by(
            func.sum(OrderItem.quantity).desc()
        ).limit(limit).all()
        
        # Extract just the Product objects
        products = [product for product, total_sold in popular_products]
        
        # If not enough popular products, fill with random products
        if len(products) < limit:
            existing_ids = [p.id for p in products]
            additional = db_session.query(Product).options(
                joinedload(Product.variants)
            ).filter(
                ~Product.id.in_(existing_ids) if existing_ids else True
            ).limit(limit - len(products)).all()
            products.extend(additional)
        
        return products
    finally:
        if should_close:
            db_session.close()
