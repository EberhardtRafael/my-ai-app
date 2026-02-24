"""
Unit tests for backend recommendation engine
Run with: pytest test_backend.py -v
"""
import pytest
from backend import app

@pytest.fixture
def client():
    """Create a test client for the backend app"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestRecommendationAPI:
    """Test the recommendation endpoint"""
    
    def test_recommend_endpoint_exists(self, client):
        """Test that /recommend endpoint exists"""
        response = client.post('/recommend', json={
            'feature1': 0.5,
            'feature2': 0.5
        })
        assert response.status_code in [200, 400]  # Should exist and respond
    
    def test_recommend_valid_input(self, client):
        """Test recommendation with valid features"""
        response = client.post('/recommend', json={
            'feature1': 0.3,
            'feature2': 0.7
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'recommendations' in data
        assert isinstance(data['recommendations'], list)
        assert len(data['recommendations']) > 0
        
        # Check structure of recommendations
        rec = data['recommendations'][0]
        assert 'item_id' in rec
        assert 'feature1' in rec
        assert 'feature2' in rec
    
    def test_recommend_missing_feature1(self, client):
        """Test that missing feature1 returns error"""
        response = client.post('/recommend', json={
            'feature2': 0.5
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_recommend_missing_feature2(self, client):
        """Test that missing feature2 returns error"""
        response = client.post('/recommend', json={
            'feature1': 0.5
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_recommend_no_body(self, client):
        """Test that request without body returns error"""
        response = client.post('/recommend')
        # Returns 415 (Unsupported Media Type) or 400 (Bad Request)
        assert response.status_code in [400, 415]
    
    def test_recommend_boundary_values(self, client):
        """Test recommendations with boundary values"""
        test_cases = [
            {'feature1': 0.0, 'feature2': 0.0},
            {'feature1': 1.0, 'feature2': 1.0},
            {'feature1': 0.5, 'feature2': 0.5},
        ]
        
        for features in test_cases:
            response = client.post('/recommend', json=features)
            assert response.status_code == 200
            data = response.get_json()
            assert 'recommendations' in data
            assert len(data['recommendations']) > 0
