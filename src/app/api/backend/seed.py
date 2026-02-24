from models import Product, Variant, User, session, init_db
import random
import hashlib

def seed_data():
    init_db()
    
    # Seed users
    print("Seeding users...")
    users = [
        {"username": "test", "email": "test@example.com", "password": "test"},
        {"username": "john", "email": "john@example.com", "password": "password123"},
        {"username": "jane", "email": "jane@example.com", "password": "password123"},
    ]
    
    for user_data in users:
        password_hash = hashlib.sha256(user_data["password"].encode()).hexdigest()
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            password_hash=password_hash
        )
        session.add(user)
    session.commit()
    print(f"Created {len(users)} users")
    
    # Seed products
    print("Seeding products...")
    categories = ["Clothing", "Footwear", "Accessories", "Tools", "Equipment"]
    colors = ["Navy", "Charcoal", "Olive", "Burgundy", "Cream"]
    sizes = ["S", "M", "L", "XL"]

    for i in range(1000):
        product = Product(
            name=f"Product {i}",
            category=random.choice(categories),
            price=round(random.uniform(20, 500), 2)
        )
        for _ in range(random.randint(1, 4)):
            variant = Variant(
                sku=f"SKU-{i}-{random.randint(1000,9999)}",
                color=random.choice(colors),
                size=random.choice(sizes),
                stock=random.randint(0, 100)
            )
            product.variants.append(variant)
        session.add(product)
    session.commit()
    print("Database seeded with sample data")

if __name__ == "__main__":
    seed_data()
