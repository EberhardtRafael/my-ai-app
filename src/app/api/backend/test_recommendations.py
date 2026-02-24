"""
Test personalized recommendations functionality
"""
import pytest
from models import User, Product, Order, OrderItem, Favorite, session
from recommendations import (
    get_personalized_recommendations,
    get_trending_products,
    build_user_item_matrix,
    calculate_item_similarity
)


def test_personalized_recommendations_for_new_user(db_session):
    """Test that new users get trending products"""
    # Create a new user with no history
    new_user = User(
        username="newuser",
        email="newuser@example.com",
        password_hash="hash123"
    )
    session.add(new_user)
    session.commit()
    
    # Get recommendations for new user
    recommendations = get_personalized_recommendations(new_user.id, limit=5)
    
    # Should get some trending products
    assert len(recommendations) > 0
    assert all(isinstance(p, Product) for p in recommendations)


def test_personalized_recommendations_with_purchase_history(db_session):
    """Test that users with purchase history get collaborative filtering recommendations"""
    # Create user and add purchase history
    user = session.query(User).first()
    
    # Create a completed order
    order = Order(user_id=user.id, status="delivered")
    session.add(order)
    session.commit()
    
    # Add items to order
    products = session.query(Product).limit(3).all()
    for product in products:
        variant = product.variants[0]
        item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            variant_id=variant.id,
            quantity=1,
            price=product.price,
            product_name=product.name,
            color=variant.color,
            size=variant.size
        )
        session.add(item)
    session.commit()
    
    # Get recommendations
    recommendations = get_personalized_recommendations(user.id, limit=5)
    
    # Should get recommendations
    assert len(recommendations) > 0
    # Recommendations should not include purchased products
    purchased_ids = [p.id for p in products]
    recommended_ids = [r.id for r in recommendations]
    assert not any(pid in recommended_ids for pid in purchased_ids)


def test_personalized_recommendations_with_favorites_only(db_session):
    """Test that users with only favorites get category-based recommendations"""
    # Create user
    user = User(
        username="favoriteuser",
        email="favoriteuser@example.com",
        password_hash="hash123"
    )
    session.add(user)
    session.commit()
    
    # Add favorites
    products = session.query(Product).limit(2).all()
    for product in products:
        favorite = Favorite(user_id=user.id, product_id=product.id)
        session.add(favorite)
    session.commit()
    
    # Get recommendations
    recommendations = get_personalized_recommendations(user.id, limit=5)
    
    # Should get recommendations from same categories
    assert len(recommendations) > 0
    favorite_categories = [p.category for p in products]
    # At least some recommendations should be from favorite categories
    recommended_categories = [r.category for r in recommendations]
    assert any(cat in favorite_categories for cat in recommended_categories)


def test_trending_products(db_session):
    """Test that trending products are returned correctly"""
    trending = get_trending_products(limit=5)
    
    # Should return products
    assert len(trending) > 0
    assert len(trending) <= 5
    assert all(isinstance(p, Product) for p in trending)


def test_personalized_recommendations_limit(db_session):
    """Test that limit parameter is respected"""
    user = session.query(User).first()
    
    # Test different limits
    for limit in [3, 5, 8]:
        recommendations = get_personalized_recommendations(user.id, limit=limit)
        assert len(recommendations) <= limit


def test_collaborative_filtering_components(db_session):
    """Test that collaborative filtering components work"""
    # Build user-item matrix
    matrix = build_user_item_matrix()
    
    if not matrix.empty:
        # Calculate similarity
        similarity = calculate_item_similarity(matrix)
        assert not similarity.empty
        assert similarity.shape[0] == similarity.shape[1]  # Should be square matrix
