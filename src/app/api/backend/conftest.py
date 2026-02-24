import pytest
import sys
import os

# Add parent directory to path so we can import our modules
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import app as flask_app
from models import Base, engine, session

@pytest.fixture
def app():
    """Create and configure a test Flask app instance."""
    flask_app.config.update({
        "TESTING": True,
    })
    yield flask_app

@pytest.fixture
def client(app):
    """A test client for the Flask app."""
    return app.test_client()

@pytest.fixture(scope='function')
def db_session():
    """Create a fresh database session for each test."""
    # Create all tables
    Base.metadata.create_all(engine)
    
    yield session
    
    # Rollback any changes and close session after test
    session.rollback()
    session.close()
    
    # Optionally drop all tables after tests (comment out if you want to inspect DB)
    # Base.metadata.drop_all(engine)
