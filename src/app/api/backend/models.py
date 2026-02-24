''' 
    Defines the tables that will exist in my database (Product, Variant)
    How they're related (foreign keys, relationships - one to many or many to one)
    How to connect to the database (engine, session)
    How to initialize it cleanly (init_db())
    This file creates the infrastructure necessary for the database to exist.
    It's populated by another code (seed.py)
'''
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship, sessionmaker, declarative_base
from datetime import datetime

Base = declarative_base()

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    category = Column(String)
    price = Column(Float)
    
    # Enhanced fields for ML and content-based filtering
    description = Column(String, nullable=True)  # Full text description for NLP/TF-IDF
    brand = Column(String, nullable=True)  # Brand for similarity matching
    material = Column(String, nullable=True)  # Material type (cotton, leather, etc.)
    tags = Column(String, nullable=True)  # Comma-separated tags for quick filtering
    rating_avg = Column(Float, default=0.0)  # Average rating (0-5 stars)
    rating_count = Column(Integer, default=0)  # Number of ratings for confidence
    sales_count = Column(Integer, default=0)  # Total units sold for popularity
    image_url = Column(String, nullable=True)  # Product image URL
    created_at = Column(DateTime, default=datetime.utcnow)
    
    variants = relationship("Variant", back_populates="product", cascade="all, delete-orphan")
    #There's a relation of one product to many variants

class Variant(Base):
    __tablename__ = "variants"
    id = Column(Integer, primary_key=True)
    sku = Column(String)
    color = Column(String)
    size = Column(String)
    stock = Column(Integer)
    product_id = Column(Integer, ForeignKey("products.id")) #each variant points to ONE product
    product = relationship("Product", back_populates="variants")
    #There's a relation of many variants to one product

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    #There's a relation of one user to many favorites

class Favorite(Base):
    __tablename__ = "favorites"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    removed_at = Column(DateTime, nullable=True)  # NULL means still favorited
    user = relationship("User", back_populates="favorites")
    product = relationship("Product")
    #There's a relation of many favorites to one user and one product

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="cart", nullable=False)  # cart (draft), pending, processing, shipped, delivered, cancelled
    total = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    shipping = Column(Float, default=0.0)
    # Shipping info (NULL for cart status)
    full_name = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    country = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    # Payment info (NULL for cart status)
    card_last4 = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    #There's a relation of one order to many order items

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("variants.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)  # Price at time of adding
    product_name = Column(String, nullable=False)  # Snapshot of product name
    color = Column(String, nullable=False)
    size = Column(String, nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    variant = relationship("Variant")
    #There's a relation of many order items to one order

# DB setup
engine = create_engine("sqlite:///products.db")
Session = sessionmaker(bind=engine)
session = Session()

def init_db():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)