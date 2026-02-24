# schema.py
'''
    Defines the GraphQL API schema using Strawberry
    Types: Define what data structures are exposed to the API
    Queries: Read operations (get users, products, favorites)
    Mutations: Write operations (create users, add/remove favorites)
'''
import strawberry
from typing import List, Optional
from models import Product, Variant, User, Favorite, Order, OrderItem, session
from sqlalchemy import or_
from datetime import datetime
import hashlib

# GraphQL Types - Define the structure of data returned by API

@strawberry.type
class VariantType:
    id: int
    sku: str
    color: str
    size: str
    stock: int

@strawberry.type
class ProductType:
    id: int
    name: str
    category: str
    price: float
    variants: List[VariantType]

@strawberry.type
class UserType:
    # Note: password_hash is NOT exposed in this type for security
    id: int
    username: str
    email: str

@strawberry.type
class FavoriteType:
    id: int
    user_id: int
    product_id: int
    created_at: str  # ISO format timestamp
    removed_at: Optional[str]  # NULL if still favorited
    product: ProductType  # Full product details included
    
    @staticmethod
    def from_db(favorite):
        # Convert SQLAlchemy model to GraphQL type with datetime conversion
        return FavoriteType(
            id=favorite.id,
            user_id=favorite.user_id,
            product_id=favorite.product_id,
            created_at=favorite.created_at.isoformat() if favorite.created_at else None,
            removed_at=favorite.removed_at.isoformat() if favorite.removed_at else None,
            product=favorite.product
        )

@strawberry.type
class FavoriteResponse:
    favorite: Optional[FavoriteType]
    total_count: int

@strawberry.type
class OrderItemType:
    id: int
    order_id: int
    product_id: int
    variant_id: int
    quantity: int
    price: float
    product_name: str
    color: str
    size: str
    added_at: str
    product: ProductType
    variant: VariantType
    
    @staticmethod
    def from_db(order_item):
        return OrderItemType(
            id=order_item.id,
            order_id=order_item.order_id,
            product_id=order_item.product_id,
            variant_id=order_item.variant_id,
            quantity=order_item.quantity,
            price=order_item.price,
            product_name=order_item.product_name,
            color=order_item.color,
            size=order_item.size,
            added_at=order_item.added_at.isoformat() if order_item.added_at else None,
            product=order_item.product,
            variant=order_item.variant
        )

@strawberry.type
class OrderType:
    id: int
    user_id: int
    status: str
    total: float
    subtotal: float
    tax: float
    shipping: float
    full_name: Optional[str]
    address: Optional[str]
    city: Optional[str]
    postal_code: Optional[str]
    country: Optional[str]
    phone: Optional[str]
    card_last4: Optional[str]
    created_at: str
    updated_at: str
    items: List[OrderItemType]
    
    @staticmethod
    def from_db(order):
        return OrderType(
            id=order.id,
            user_id=order.user_id,
            status=order.status,
            total=order.total or 0.0,
            subtotal=order.subtotal or 0.0,
            tax=order.tax or 0.0,
            shipping=order.shipping or 0.0,
            full_name=order.full_name,
            address=order.address,
            city=order.city,
            postal_code=order.postal_code,
            country=order.country,
            phone=order.phone,
            card_last4=order.card_last4,
            created_at=order.created_at.isoformat() if order.created_at else None,
            updated_at=order.updated_at.isoformat() if order.updated_at else None,
            items=[OrderItemType.from_db(item) for item in order.items]
        )

# Queries - Read operations

@strawberry.type
class Query:
    @strawberry.field
    def products(self, searchTerm: str = None, category: str = None, color: str = None, offset: int = None, limit: int = None) -> List[ProductType]:
        # Query products with optional filters and pagination
        query = session.query(Product)
        if color or searchTerm:
            query = query.join(Variant)
        if category:
            query = query.filter(Product.category == category)
        if color:
            # join the Variant table and filter by color
            query = query.filter(Variant.color == color)
        if searchTerm:
            like_pattern = f"%{searchTerm}%"
            query = query.filter(
                or_(
                    Product.name.ilike(like_pattern),
                    Product.category.ilike(like_pattern),
                    Variant.sku.ilike(like_pattern),
                    Variant.color.ilike(like_pattern),
                )
            )
        query = query.distinct().order_by(Product.id)
        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)
        products = query.all()

        if color:
            for product in products:
                product.variants = [variant for variant in product.variants if variant.color == color]
        return products
    
    @strawberry.field
    def product(self, id: int) -> ProductType:
        # Get a single product by ID
        return session.query(Product).get(id)
    
    @strawberry.field
    def user(self, id: int) -> Optional[UserType]:
        # Get a user by ID
        return session.query(User).get(id)
    
    @strawberry.field
    def user_by_username(self, username: str) -> Optional[UserType]:
        # Get a user by username (used for login)
        return session.query(User).filter(User.username == username).first()
    
    @strawberry.field
    def verify_user(self, username: str, password_hash: str) -> Optional[UserType]:
        # Verify user credentials by username and password hash
        # Used for authentication
        user = session.query(User).filter(
            User.username == username,
            User.password_hash == password_hash
        ).first()
        return user
    
    @strawberry.field
    def favorites(self, user_id: int, active_only: bool = True) -> List[FavoriteType]:
        # Get user's favorite products
        # active_only=True returns only current favorites (removed_at is NULL)
        # active_only=False returns all favorites including removed ones (for history/statistics)
        query = session.query(Favorite).filter(Favorite.user_id == user_id)
        if active_only:
            query = query.filter(Favorite.removed_at.is_(None))
        favorites = query.all()
        # Convert datetime objects to ISO format strings for JSON serialization
        return [FavoriteType.from_db(fav) for fav in favorites]
    
    @strawberry.field
    def cart(self, user_id: int) -> Optional[OrderType]:
        # Get user's cart (order with status="cart")
        # Creates a new cart if one doesn't exist
        cart = session.query(Order).filter(
            Order.user_id == user_id,
            Order.status == "cart"
        ).first()
        if not cart:
            cart = Order(user_id=user_id, status="cart")
            session.add(cart)
            session.commit()
        return OrderType.from_db(cart)
    
    @strawberry.field
    def orders(self, user_id: int) -> List[OrderType]:
        # Get all completed orders for a user (excludes cart), sorted by newest first
        orders = session.query(Order).filter(
            Order.user_id == user_id,
            Order.status != "cart"
        ).order_by(Order.created_at.desc()).all()
        return [OrderType.from_db(order) for order in orders]
    
    @strawberry.field
    def order(self, order_id: int) -> Optional[OrderType]:
        # Get a single order by ID
        order = session.query(Order).get(order_id)
        return OrderType.from_db(order) if order else None
    
    @strawberry.field
    def recommendations(self, user_id: int, limit: int = 5) -> List[ProductType]:
        # Get ML-powered product recommendations based on user's cart
        # Uses collaborative filtering to suggest products based on purchase patterns
        from recommendations import get_cart_recommendations
        return get_cart_recommendations(user_id, limit)

# Mutations - Write operations

@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_user(self, username: str, email: str, password: str) -> UserType:
        # Create a new user with hashed password
        # Password is hashed using SHA256 for security
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        user = User(username=username, email=email, password_hash=password_hash)
        session.add(user)
        session.commit()
        return user
    
    @strawberry.mutation
    def add_favorite(self, user_id: int, product_id: int) -> FavoriteResponse:
        # Add a product to user's favorites
        # If already favorited and active, returns existing favorite
        # If previously removed, creates a new favorite entry
        existing = session.query(Favorite).filter(
            Favorite.user_id == user_id,
            Favorite.product_id == product_id,
            Favorite.removed_at.is_(None)
        ).first()
        
        if existing:
            favorite_type = FavoriteType.from_db(existing)
        else:
            favorite = Favorite(user_id=user_id, product_id=product_id)
            session.add(favorite)
            session.commit()
            favorite_type = FavoriteType.from_db(favorite)
        
        # Get total count of active favorites
        total_count = session.query(Favorite).filter(
            Favorite.user_id == user_id,
            Favorite.removed_at.is_(None)
        ).count()
        
        return FavoriteResponse(favorite=favorite_type, total_count=total_count)
    
    @strawberry.mutation
    def remove_favorite(self, user_id: int, product_id: int) -> int:
        # Remove a product from user's favorites (soft delete)
        # Sets removed_at timestamp instead of deleting the record
        # This preserves history for statistics and analysis
        # Returns the updated count of active favorites
        favorite = session.query(Favorite).filter(
            Favorite.user_id == user_id,
            Favorite.product_id == product_id,
            Favorite.removed_at.is_(None)
        ).first()
        
        if favorite:
            favorite.removed_at = datetime.utcnow()
            session.commit()
        
        # Get total count of active favorites
        total_count = session.query(Favorite).filter(
            Favorite.user_id == user_id,
            Favorite.removed_at.is_(None)
        ).count()
        
        return total_count
    
    @strawberry.mutation
    def add_to_cart(self, user_id: int, product_id: int, variant_id: int, quantity: int = 1) -> OrderItemType:
        # Add item to user's cart (order with status="cart")
        # If item already exists, increase quantity
        cart = session.query(Order).filter(
            Order.user_id == user_id,
            Order.status == "cart"
        ).first()
        if not cart:
            cart = Order(user_id=user_id, status="cart")
            session.add(cart)
            session.flush()
        
        # Get product details for snapshot
        product = session.query(Product).get(product_id)
        variant = session.query(Variant).get(variant_id)
        
        existing_item = session.query(OrderItem).filter(
            OrderItem.order_id == cart.id,
            OrderItem.product_id == product_id,
            OrderItem.variant_id == variant_id
        ).first()
        
        if existing_item:
            existing_item.quantity += quantity
            session.commit()
            return OrderItemType.from_db(existing_item)
        
        order_item = OrderItem(
            order_id=cart.id,
            product_id=product_id,
            variant_id=variant_id,
            quantity=quantity,
            price=product.price,
            product_name=product.name,
            color=variant.color,
            size=variant.size
        )
        session.add(order_item)
        session.commit()
        return OrderItemType.from_db(order_item)
    
    @strawberry.mutation
    def update_cart_item(self, item_id: int, quantity: int) -> OrderItemType:
        # Update quantity of a cart item
        item = session.query(OrderItem).get(item_id)
        if item:
            item.quantity = quantity
            session.commit()
            return OrderItemType.from_db(item)
        return None
    
    @strawberry.mutation
    def remove_from_cart(self, item_id: int) -> bool:
        # Remove item from cart (hard delete)
        item = session.query(OrderItem).get(item_id)
        if item:
            session.delete(item)
            session.commit()
            return True
        return False
    
    @strawberry.mutation
    def clear_cart(self, user_id: int) -> bool:
        # Remove all items from user's cart
        cart = session.query(Order).filter(
            Order.user_id == user_id,
            Order.status == "cart"
        ).first()
        if cart:
            session.query(OrderItem).filter(OrderItem.order_id == cart.id).delete()
            session.commit()
            return True
        return False
    
    @strawberry.mutation
    def checkout_cart(
        self,
        user_id: int,
        full_name: str,
        address: str,
        city: str,
        postal_code: str,
        country: str,
        phone: str,
        card_last4: str,
        subtotal: float,
        tax: float,
        shipping: float,
        total: float
    ) -> OrderType:
        # Convert cart to order by updating status and adding shipping/payment info
        # A new cart will be automatically created on next request
        cart = session.query(Order).filter(
            Order.user_id == user_id,
            Order.status == "cart"
        ).first()
        
        if not cart:
            raise Exception("No cart found for user")
        
        # Update cart to become an order
        cart.status = "pending"
        cart.full_name = full_name
        cart.address = address
        cart.city = city
        cart.postal_code = postal_code
        cart.country = country
        cart.phone = phone
        cart.card_last4 = card_last4
        cart.subtotal = subtotal
        cart.tax = tax
        cart.shipping = shipping
        cart.total = total
        
        session.commit()
        return OrderType.from_db(cart)

schema = strawberry.Schema(query=Query, mutation=Mutation)
