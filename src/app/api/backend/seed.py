from models import Product, Variant, session, init_db
import random

def seed_data():
    init_db()
    categories = ["Clothing", "Footwear", "Accessories", "Tools", "Equipment"]
    colors = ["Red", "Blue", "Black", "White", "Green"]
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
