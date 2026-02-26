# schema.py
'''
    Defines the GraphQL API schema using Strawberry
    Types: Define what data structures are exposed to the API
    Queries: Read operations (get users, products, favorites)
    Mutations: Write operations (create users, add/remove favorites)
'''
import strawberry
from typing import List, Optional
from models import Product, Variant, User, Favorite, Order, OrderItem, Review, session
from sqlalchemy import or_, func
from datetime import datetime
import hashlib
from werkzeug.security import check_password_hash, generate_password_hash

# GraphQL Types - Define the structure of data returned by API

@strawberry.type
class VariantType:
    id: int
    sku: str
    color: str
    size: str
    stock: int
    
    @staticmethod
    def from_db(variant):
        return VariantType(
            id=variant.id,
            sku=variant.sku,
            color=variant.color,
            size=variant.size,
            stock=variant.stock
        )

@strawberry.type
class ProductType:
    id: int
    name: str
    category: str
    price: float
    description: Optional[str]
    brand: Optional[str]
    material: Optional[str]
    tags: Optional[str]
    ratingAvg: float
    ratingCount: int
    salesCount: int
    imageUrl: Optional[str]
    createdAt: str
    variants: List[VariantType]
    
    @staticmethod
    def from_db(product):
        return ProductType(
            id=product.id,
            name=product.name,
            category=product.category,
            price=product.price,
            description=product.description,
            brand=product.brand,
            material=product.material,
            tags=product.tags,
            ratingAvg=product.rating_avg or 0.0,
            ratingCount=product.rating_count or 0,
            salesCount=product.sales_count or 0,
            imageUrl=product.image_url,
            createdAt=product.created_at.isoformat() if product.created_at else "",
            variants=[VariantType.from_db(v) for v in product.variants]
        )

@strawberry.type
class UserType:
    # Note: password_hash is NOT exposed in this type for security
    id: int
    username: str
    email: str

@strawberry.type
class ReviewType:
    id: int
    productId: int
    userId: int
    username: str
    rating: int
    title: Optional[str]
    comment: Optional[str]
    verifiedPurchase: bool
    helpfulCount: int
    createdAt: str
    updatedAt: str
    
    @staticmethod
    def from_db(review):
        return ReviewType(
            id=review.id,
            productId=review.product_id,
            userId=review.user_id,
            username=review.user.username if review.user else "Anonymous",
            rating=review.rating,
            title=review.title,
            comment=review.comment,
            verifiedPurchase=bool(review.verified_purchase),
            helpfulCount=review.helpful_count,
            createdAt=review.created_at.isoformat() if review.created_at else "",
            updatedAt=review.updated_at.isoformat() if review.updated_at else ""
        )

@strawberry.type
class ReviewStatsType:
    rating1: int
    rating2: int
    rating3: int
    rating4: int
    rating5: int

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
        return [ProductType.from_db(p) for p in products]
    
    @strawberry.field
    def product(self, id: int) -> ProductType:
        # Get a single product by ID
        db_product = session.query(Product).get(id)
        return ProductType.from_db(db_product) if db_product else None
    
    @strawberry.field
    def user(self, id: int) -> Optional[UserType]:
        # Get a user by ID
        return session.query(User).get(id)
    
    @strawberry.field
    def user_by_username(self, username: str) -> Optional[UserType]:
        # Get a user by username (used for login)
        return session.query(User).filter(User.username == username).first()

    @strawberry.field
    def user_by_email(self, email: str) -> Optional[UserType]:
        # Get a user by email (used for password reset and SSO account linking)
        return session.query(User).filter(User.email == email).first()
    
    @strawberry.field
    def verify_user(self, username: str, password: str) -> Optional[UserType]:
        # Verify user credentials by username and plaintext password.
        # Supports secure Werkzeug hashes and legacy SHA256 hashes.
        user = session.query(User).filter(User.username == username).first()

        if not user:
            return None

        try:
            if check_password_hash(user.password_hash, password):
                return user
        except ValueError:
            # Legacy hash format or malformed hash: fallback check below.
            pass

        legacy_hash = hashlib.sha256(password.encode()).hexdigest()
        if user.password_hash == legacy_hash:
            return user

        return None
    
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
        products = get_cart_recommendations(user_id, limit)
        return [ProductType.from_db(p) for p in products]
    
    @strawberry.field
    def trending(self, hours: int = 48, limit: int = 10) -> List[ProductType]:
        """
        Get trending products based on cart additions in the last N hours
        Simple COUNT query showing social proof of "hot items everyone's buying"
        """
        from datetime import timedelta
        from sqlalchemy import func
        
        # Calculate cutoff time
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        # Query: Count cart additions per product in the time window
        trending_query = (
            session.query(
                OrderItem.product_id,
                func.count(OrderItem.id).label('add_count')
            )
            .join(Order)
            .filter(
                OrderItem.added_at >= cutoff_time,
                Order.status == "cart"  # Only count items still in carts
            )
            .group_by(OrderItem.product_id)
            .order_by(func.count(OrderItem.id).desc())
            .limit(limit)
        )
        
        # Get product IDs and their counts
        trending_products = trending_query.all()
        
        if not trending_products:
            return []
        
        # Fetch full product details
        product_ids = [p.product_id for p in trending_products]
        products = session.query(Product).filter(Product.id.in_(product_ids)).all()
        
        # Sort products by their trending count
        product_map = {p.id: p for p in products}
        sorted_products = [
            product_map[pid] for pid, _ in trending_products if pid in product_map
        ]
        
        return [ProductType.from_db(p) for p in sorted_products]
    
    @strawberry.field
    def personalized_recommendations(self, user_id: int, limit: int = 8) -> List[ProductType]:
        # Get personalized "For You" recommendations for homepage
        # Uses collaborative filtering based on user's browsing/purchase history
        # Falls back to trending/popular products for new users
        from recommendations import get_personalized_recommendations
        products = get_personalized_recommendations(user_id, limit)
        return [ProductType.from_db(p) for p in products]
    
    @strawberry.field
    def reviews(self, product_id: int, limit: int = 20, offset: int = 0) -> List[ReviewType]:
        # Get reviews for a specific product with pagination
        reviews = (
            session.query(Review)
            .filter(Review.product_id == product_id)
            .order_by(Review.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )
        return [ReviewType.from_db(r) for r in reviews]
    
    @strawberry.field
    def review_stats(self, product_id: int) -> ReviewStatsType:
        # Get review statistics for a product (rating distribution)
        stats = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        }
        
        reviews = session.query(Review.rating).filter(Review.product_id == product_id).all()
        for (rating,) in reviews:
            stats[rating] = stats.get(rating, 0) + 1
        
        return ReviewStatsType(
            rating1=stats[1],
            rating2=stats[2],
            rating3=stats[3],
            rating4=stats[4],
            rating5=stats[5]
        )

# Mutations - Write operations

@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_user(self, username: str, email: str, password: str) -> UserType:
        # Create a new user with hashed password
        existing_user = session.query(User).filter(
            or_(User.username == username, User.email == email)
        ).first()

        if existing_user:
            raise ValueError("Username or email already in use")

        password_hash = generate_password_hash(password)
        user = User(username=username, email=email, password_hash=password_hash)
        session.add(user)
        session.commit()
        return user

    @strawberry.mutation
    def reset_user_password(self, email: str, password: str) -> bool:
        # Reset account password by email
        user = session.query(User).filter(User.email == email).first()

        if not user:
            return False

        user.password_hash = generate_password_hash(password)
        session.commit()
        return True
    
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
    def update_cart_item(self, user_id: int, item_id: int, quantity: int) -> OrderItemType:
        # Update quantity of a cart item only when it belongs to user's active cart
        item = (
            session.query(OrderItem)
            .join(Order, Order.id == OrderItem.order_id)
            .filter(
                OrderItem.id == item_id,
                Order.user_id == user_id,
                Order.status == "cart"
            )
            .first()
        )
        if item:
            item.quantity = quantity
            session.commit()
            return OrderItemType.from_db(item)
        return None
    
    @strawberry.mutation
    def remove_from_cart(self, user_id: int, item_id: int) -> bool:
        # Remove item from cart only when it belongs to user's active cart
        item = (
            session.query(OrderItem)
            .join(Order, Order.id == OrderItem.order_id)
            .filter(
                OrderItem.id == item_id,
                Order.user_id == user_id,
                Order.status == "cart"
            )
            .first()
        )
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
    
    @strawberry.mutation
    def submit_review(
        self,
        product_id: int,
        user_id: int,
        rating: int,
        title: Optional[str] = None,
        comment: Optional[str] = None
    ) -> ReviewType:
        # Submit or update a review for a product
        # Check if user already reviewed this product
        existing_review = session.query(Review).filter(
            Review.product_id == product_id,
            Review.user_id == user_id
        ).first()
        
        # Validate rating
        if rating < 1 or rating > 5:
            raise Exception("Rating must be between 1 and 5")
        
        # Check if user purchased this product (verified purchase)
        verified_purchase = session.query(OrderItem).join(Order).filter(
            OrderItem.product_id == product_id,
            Order.user_id == user_id,
            Order.status != "cart"
        ).first() is not None
        
        if existing_review:
            # Update existing review
            existing_review.rating = rating
            existing_review.title = title
            existing_review.comment = comment
            existing_review.updated_at = datetime.utcnow()
            session.commit()
            review = existing_review
        else:
            # Create new review
            review = Review(
                product_id=product_id,
                user_id=user_id,
                rating=rating,
                title=title,
                comment=comment,
                verified_purchase=1 if verified_purchase else 0
            )
            session.add(review)
            session.commit()
        
        # Recalculate product rating average and count
        all_reviews = session.query(Review).filter(Review.product_id == product_id).all()
        product = session.query(Product).get(product_id)
        if product:
            product.rating_count = len(all_reviews)
            product.rating_avg = sum(r.rating for r in all_reviews) / len(all_reviews) if all_reviews else 0.0
            session.commit()
        
        return ReviewType.from_db(review)
    
    @strawberry.mutation
    def mark_review_helpful(self, review_id: int) -> ReviewType:
        # Mark a review as helpful (increment helpful_count)
        review = session.query(Review).get(review_id)
        if not review:
            raise Exception("Review not found")
        
        review.helpful_count += 1
        session.commit()
        return ReviewType.from_db(review)

schema = strawberry.Schema(query=Query, mutation=Mutation)
