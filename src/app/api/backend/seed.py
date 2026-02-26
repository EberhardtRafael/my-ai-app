from models import Product, Variant, User, session, init_db
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
                    rating_avg=round(random.uniform(3.5, 5.0), 1),  # Most products rated 3.5-5 stars
                    rating_count=random.randint(10, 500),
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

if __name__ == "__main__":
    seed_data()
