''' 
    Defines the tables that will exist in my database (Product, Variant)
    How they're related (foreign keys, relationships - one to many or many to one)
    How to connect to the database (engine, session)
    How to initialize it cleanly (init_db())
    This file creates the infrastructure necessary for the database to exist.
    It's populated by another code (seed.py)
'''
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship, sessionmaker, declarative_base

Base = declarative_base()

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    category = Column(String)
    price = Column(Float)
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

# DB setup
engine = create_engine("sqlite:///products.db")
Session = sessionmaker(bind=engine)
session = Session()

def init_db():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)