from sqlalchemy import func
from models import Product, ProductRelation, Variant, Review, User, session, init_db
import random
from werkzeug.security import generate_password_hash

# Realistic product data for better ML recommendations
PRODUCT_CATALOG = {
    "Clothing": {
        "brands": ["Urban Outfitters", "H&M", "Zara", "Nike", "Adidas"],
        "items": [
            {"name": "Classic Cotton T-Shirt", "material": "Cotton", "tags": "casual,everyday,comfortable", 
             "desc": "Soft, breathable cotton t-shirt perfect for everyday wear. Classic fit with reinforced seams."},
            {"name": "Slim Fit Denim Jeans", "material": "Denim", "tags": "casual,durable,classic",
             "desc": "Premium denim jeans with a modern slim fit. Features stretch fabric for comfort and mobility."},
            {"name": "Hooded Sweatshirt", "material": "Cotton Blend", "tags": "casual,warm,cozy",
             "desc": "Heavyweight cotton-poly blend hoodie with kangaroo pocket and adjustable drawstring hood."},
            {"name": "Athletic Performance Shirt", "material": "Polyester", "tags": "sports,breathable,moisture-wicking",
             "desc": "Lightweight, moisture-wicking athletic shirt designed for high-performance training and workouts."},
            {"name": "Wool Blend Sweater", "material": "Wool Blend", "tags": "warm,elegant,winter",
             "desc": "Luxurious wool blend sweater with ribbed cuffs and hem. Perfect for layering in cold weather."},
        ],
        "price_range": (25, 120)
    },
    "Footwear": {
        "brands": ["Nike", "Adidas", "New Balance", "Vans", "Converse"],
        "items": [
            {"name": "Running Shoes", "material": "Mesh/Rubber", "tags": "sports,running,lightweight",
             "desc": "Engineered mesh upper with responsive cushioning. Designed for neutral runners seeking speed and comfort."},
            {"name": "Leather Sneakers", "material": "Leather", "tags": "casual,durable,classic",
             "desc": "Premium leather sneakers with cushioned insole. Timeless design suitable for any casual occasion."},
            {"name": "High-Top Canvas Shoes", "material": "Canvas", "tags": "casual,retro,comfortable",
             "desc": "Classic high-top canvas sneakers with vulcanized rubber sole. Iconic style for everyday wear."},
            {"name": "Trail Hiking Boots", "material": "Leather/Synthetic", "tags": "outdoor,durable,waterproof",
             "desc": "Rugged hiking boots with waterproof membrane and aggressive tread. Built for challenging terrain."},
            {"name": "Slip-On Loafers", "material": "Suede", "tags": "casual,elegant,comfortable",
             "desc": "Soft suede loafers with cushioned footbed. Easy slip-on style perfect for relaxed occasions."},
        ],
        "price_range": (60, 180)
    },
    "Accessories": {
        "brands": ["Fossil", "Michael Kors", "Ray-Ban", "Timex", "Oakley"],
        "items": [
            {"name": "Leather Wallet", "material": "Leather", "tags": "everyday,elegant,durable",
             "desc": "Full-grain leather bifold wallet with multiple card slots and bill compartment. RFID protected."},
            {"name": "Polarized Sunglasses", "material": "Metal/Polycarbonate", "tags": "outdoor,stylish,uv-protection",
             "desc": "Lightweight metal frame with polarized lenses. 100% UV protection for bright sunny days."},
            {"name": "Canvas Backpack", "material": "Canvas", "tags": "casual,spacious,durable",
             "desc": "Durable canvas backpack with padded laptop compartment. Multiple pockets for organization."},
            {"name": "Analog Wristwatch", "material": "Stainless Steel", "tags": "elegant,timeless,water-resistant",
             "desc": "Classic analog watch with stainless steel case and leather strap. Water resistant to 50m."},
            {"name": "Wool Beanie Hat", "material": "Wool", "tags": "warm,winter,comfortable",
             "desc": "Soft merino wool beanie with fold-over cuff. One size fits most. Perfect for cold weather."},
        ],
        "price_range": (15, 250)
    },
    "Equipment": {
        "brands": ["Coleman", "The North Face", "Patagonia", "REI", "Black Diamond"],
        "items": [
            {"name": "Camping Tent", "material": "Nylon/Polyester", "tags": "outdoor,camping,waterproof",
             "desc": "3-season tent with waterproof rainfly and aluminum poles. Sleeps 2-3 people comfortably."},
            {"name": "Sleeping Bag", "material": "Synthetic Fill", "tags": "outdoor,camping,warm",
             "desc": "Mummy-style sleeping bag rated to 20°F. Synthetic insulation stays warm when wet."},
            {"name": "Portable Water Bottle", "material": "Stainless Steel", "tags": "outdoor,eco-friendly,insulated",
             "desc": "Double-wall vacuum insulated water bottle. Keeps drinks cold for 24 hours, hot for 12 hours."},
            {"name": "Hiking Backpack", "material": "Ripstop Nylon", "tags": "outdoor,hiking,spacious",
             "desc": "40L hiking backpack with adjustable suspension system and hydration sleeve. Includes rain cover."},
            {"name": "LED Headlamp", "material": "Plastic/Aluminum", "tags": "outdoor,camping,rechargeable",
             "desc": "Rechargeable LED headlamp with 300 lumens output. Multiple brightness modes and red light option."},
        ],
        "price_range": (30, 350)
    },
    "Tools": {
        "brands": ["DeWalt", "Milwaukee", "Craftsman", "Stanley", "Bosch"],
        "items": [
            {"name": "Cordless Drill", "material": "Metal/Plastic", "tags": "power-tools,versatile,rechargeable",
             "desc": "18V cordless drill with variable speed trigger and LED work light. Includes battery and charger."},
            {"name": "Multi-Tool Set", "material": "Steel", "tags": "hand-tools,versatile,durable",
             "desc": "Complete 50-piece tool set with carrying case. Includes wrenches, screwdrivers, pliers, and more."},
            {"name": "Measuring Tape", "material": "Steel/Plastic", "tags": "hand-tools,precise,durable",
             "desc": "25-foot steel tape measure with auto-lock and belt clip. Clear markings for accurate measurements."},
            {"name": "Work Gloves", "material": "Leather/Synthetic", "tags": "safety,durable,comfortable",
             "desc": "Heavy-duty work gloves with reinforced palms and padded knuckles. Touchscreen compatible fingertips."},
            {"name": "Tool Storage Box", "material": "Plastic/Metal", "tags": "organization,portable,durable",
             "desc": "Large tool box with removable tray and metal latches. Stackable design with padlock eye."},
        ],
        "price_range": (20, 200)
    }
}

def seed_data():
    init_db()
    
    # Seed users
    print("Seeding users...")
    users = [
        {"username": "test", "email": "test@example.com", "password": "test"},
        {"username": "dev", "email": "dev@example.com", "password": "dev"},
        {"username": "john", "email": "john@example.com", "password": "password123"},
        {"username": "jane", "email": "jane@example.com", "password": "password123"},
    ]
    
    for user_data in users:
        password_hash = generate_password_hash(user_data["password"])
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            password_hash=password_hash
        )
        session.add(user)
    session.commit()
    print(f"Created {len(users)} users")
    
    # Seed products with rich attributes
    print("Seeding products with enhanced attributes...")
    colors = ["Navy", "Charcoal", "Olive", "Burgundy", "Cream", "Black", "White", "Gray", "Brown", "Blue"]
    sizes = ["XS", "S", "M", "L", "XL", "XXL"]
    
    product_id = 1
    for category, data in PRODUCT_CATALOG.items():
        for item_template in data["items"]:
            # Create 20 variations of each product template
            for variation in range(20):
                brand = random.choice(data["brands"])
                min_price, max_price = data["price_range"]
                price = round(random.uniform(min_price, max_price), 2)
                
                # Add variation to product name
                variation_suffix = f" - Style {variation + 1}" if variation > 0 else ""
                
                product = Product(
                    name=f"{item_template['name']}{variation_suffix}",
                    category=category,
                    price=price,
                    description=item_template['desc'],
                    brand=brand,
                    material=item_template['material'],
                    tags=item_template['tags'],
                    rating_avg=0.0,
                    rating_count=0,
                    sales_count=random.randint(0, 1000),
                    image_url=f"/images/products/{category.lower()}/{product_id}.jpg"
                )
                
                # Generate variants (color/size combinations)
                num_colors = random.randint(2, 4)
                available_colors = random.sample(colors, num_colors)
                
                for color in available_colors:
                    num_sizes = random.randint(3, 6)
                    available_sizes = random.sample(sizes, num_sizes)
                    
                    for size in available_sizes:
                        variant = Variant(
                            sku=f"{category[:3].upper()}-{product_id:04d}-{color[:3].upper()}-{size}",
                            color=color,
                            size=size,
                            stock=random.randint(0, 100)
                        )
                        product.variants.append(variant)
                
                session.add(product)
                product_id += 1
                
                # Commit in batches for performance
                if product_id % 50 == 0:
                    session.commit()
                    print(f"Seeded {product_id} products...")
    
    session.commit()
    print(f"Database seeded with {product_id - 1} products with rich attributes for ML!")

    print("Syncing product ratings from real reviews only...")
    sync_product_ratings_from_reviews()
    print("Product ratings synced")

    print("Seeding product relations for PDP related-products feature...")
    seed_product_relations()
    print("Product relations seeded")


def _relation_pair_key(product_id: int, related_product_id: int) -> tuple[int, int]:
    return (min(product_id, related_product_id), max(product_id, related_product_id))


def _add_bidirectional_relation(product_id: int, related_product_id: int, relation_type: str, seen_pairs: set):
    if product_id == related_product_id:
        return

    pair_key = _relation_pair_key(product_id, related_product_id)
    if pair_key in seen_pairs:
        return

    seen_pairs.add(pair_key)
    session.add(
        ProductRelation(
            product_id=product_id,
            related_product_id=related_product_id,
            relation_type=relation_type,
        )
    )
    session.add(
        ProductRelation(
            product_id=related_product_id,
            related_product_id=product_id,
            relation_type=relation_type,
        )
    )


def _tags_set(tags: str | None) -> set[str]:
    if not tags:
        return set()
    return {token.strip().lower() for token in tags.split(',') if token.strip()}


def seed_product_relations():
    session.query(ProductRelation).delete()
    session.commit()

    products = session.query(Product).order_by(Product.id).all()
    products_by_category: dict[str, list[Product]] = {}
    for product in products:
        products_by_category.setdefault(product.category or "", []).append(product)

    seen_pairs = set()

    for category_products in products_by_category.values():
        for product in category_products:
            same_category_candidates = [candidate for candidate in category_products if candidate.id != product.id]

            collection_candidates = [
                candidate
                for candidate in same_category_candidates
                if product.brand and candidate.brand and product.brand == candidate.brand
            ][:3]

            dependency_candidates = [
                candidate
                for candidate in same_category_candidates
                if (
                    (product.material and candidate.material and product.material == candidate.material)
                    or len(_tags_set(product.tags) & _tags_set(candidate.tags)) >= 2
                )
            ][:3]

            bundle_candidates = [
                candidate
                for candidate in same_category_candidates
                if max(product.price or 1, candidate.price or 1) > 0
                and abs((product.price or 0) - (candidate.price or 0)) / max(product.price or 1, candidate.price or 1) <= 0.30
            ][:2]

            for candidate in collection_candidates:
                _add_bidirectional_relation(product.id, candidate.id, "collection", seen_pairs)
            for candidate in dependency_candidates:
                _add_bidirectional_relation(product.id, candidate.id, "dependency", seen_pairs)
            for candidate in bundle_candidates:
                _add_bidirectional_relation(product.id, candidate.id, "bundle", seen_pairs)

    session.commit()


def sync_product_ratings_from_reviews():
    review_aggregates = {
        product_id: (count, avg_rating or 0.0)
        for product_id, count, avg_rating in (
            session.query(
                Review.product_id,
                func.count(Review.id),
                func.avg(Review.rating),
            )
            .group_by(Review.product_id)
            .all()
        )
    }

    products = session.query(Product).all()
    for product in products:
        count, avg_rating = review_aggregates.get(product.id, (0, 0.0))
        product.rating_count = int(count or 0)
        product.rating_avg = float(avg_rating or 0.0)

    session.commit()

if __name__ == "__main__":
    seed_data()
