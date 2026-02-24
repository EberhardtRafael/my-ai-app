"""
Unit tests for data models and database operations
Run with: pytest test_models.py -v
"""
import pytest
from models import User, Product, Variant, Favorite, session
from datetime import datetime

class TestUserModel:
    """Test the User model"""
    
    def test_user_creation(self, db_session):
        """Test creating a new user"""
        import random
        unique_email = f'test{random.randint(1000, 9999)}@example.com'
        user = User(
            username=f'testuser{random.randint(1000, 9999)}',
            email=unique_email,
            password_hash='hashed_password'
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert user.email == unique_email
    
    def test_user_query(self, db_session):
        """Test querying users"""
        users = db_session.query(User).all()
        assert isinstance(users, list)


class TestProductModel:
    """Test the Product model"""
    
    def test_product_has_variants(self, db_session):
        """Test that products can have variants"""
        products = db_session.query(Product).filter(Product.id == 1).first()
        
        if products:
            assert hasattr(products, 'variants')
            assert isinstance(products.variants, list)
    
    def test_product_query_all(self, db_session):
        """Test querying all products"""
        products = db_session.query(Product).all()
        assert isinstance(products, list)
        
        if len(products) > 0:
            product = products[0]
            assert hasattr(product, 'id')
            assert hasattr(product, 'name')
            assert hasattr(product, 'category')
            assert hasattr(product, 'price')


class TestVariantModel:
    """Test the Variant model"""
    
    def test_variant_belongs_to_product(self, db_session):
        """Test that variants are linked to products"""
        variant = db_session.query(Variant).first()
        
        if variant:
            assert hasattr(variant, 'product_id')
            assert hasattr(variant, 'product')
            assert variant.product is not None or variant.product_id is not None


class TestFavoriteModel:
    """Test the Favorite model"""
    
    def test_favorite_relationships(self, db_session):
        """Test that favorites link users and products"""
        favorite = db_session.query(Favorite).first()
        
        if favorite:
            assert hasattr(favorite, 'user_id')
            assert hasattr(favorite, 'product_id')
            assert hasattr(favorite, 'created_at')
            assert isinstance(favorite.created_at, datetime)
    
    def test_query_active_favorites(self, db_session):
        """Test querying only active (not removed) favorites"""
        active_favorites = db_session.query(Favorite).filter(
            Favorite.removed_at.is_(None)
        ).all()
        
        assert isinstance(active_favorites, list)
        
        for fav in active_favorites:
            assert fav.removed_at is None
