"""
Unit tests for the Flask GraphQL API
Run with: pytest test_app.py -v
"""
import pytest
from app import app

class TestGraphQLAPI:
    """Test the GraphQL endpoint"""
    
    def test_graphql_endpoint_exists(self, client):
        """Test that the /graphql endpoint is accessible"""
        response = client.get('/graphql')
        # GraphQL endpoint exists (400 is returned when no query provided)
        assert response.status_code in [200, 400]
    
    def test_query_all_products(self, client):
        """Test querying all products"""
        query = """
        query {
            products {
                id
                name
                category
                price
            }
        }
        """
        response = client.post(
            '/graphql',
            json={'query': query},
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'data' in data
        assert 'products' in data['data']
        assert isinstance(data['data']['products'], list)
    
    def test_query_product_by_id(self, client):
        """Test querying a specific product by ID"""
        query = """
        query {
            product(id: 1) {
                id
                name
                price
                variants {
                    id
                    color
                    size
                }
            }
        }
        """
        response = client.post(
            '/graphql',
            json={'query': query},
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'data' in data
        
        # Check if product exists
        if data['data']['product']:
            product = data['data']['product']
            assert 'id' in product
            assert 'name' in product
            assert 'variants' in product

    def test_query_related_products(self, client):
        """Test querying related products for PDP mini-PLP section"""
        query = """
        query {
            relatedProducts(productId: 1, limit: 4) {
                id
                name
                category
            }
        }
        """
        response = client.post(
            '/graphql',
            json={'query': query},
            content_type='application/json'
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'data' in data
        assert 'relatedProducts' in data['data']
        assert isinstance(data['data']['relatedProducts'], list)
    
    def test_query_user(self, client):
        """Test querying a user"""
        query = """
        query {
            user(id: 1) {
                id
                username
                email
            }
        }
        """
        response = client.post(
            '/graphql',
            json={'query': query},
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'data' in data
        
        # User may or may not exist, just check structure
        if data['data']['user']:
            user = data['data']['user']
            assert 'id' in user
            assert 'username' in user
            assert 'email' in user
            # password_hash should NOT be exposed
            assert 'password_hash' not in user
    
    def test_invalid_graphql_query(self, client):
        """Test that invalid queries return errors"""
        query = """
        query {
            invalidField {
                nonExistent
            }
        }
        """
        response = client.post(
            '/graphql',
            json={'query': query},
            content_type='application/json'
        )
        
        assert response.status_code == 200  # GraphQL returns 200 even for errors
        data = response.get_json()
        assert 'errors' in data  # But errors should be in the response
    
    def test_missing_query_parameter(self, client):
        """Test POST without query parameter"""
        response = client.post(
            '/graphql',
            json={},
            content_type='application/json'
        )
        
        # Should return error for missing query
        assert response.status_code in [200, 400]
        data = response.get_json()
        if response.status_code == 200:
            assert 'errors' in data
