import random
import json

categories = ["Clothing", "Footwear", "Accessories"]
clothing_types = ["T-Shirt", "Jeans", "Hoodie", "Jacket", "Sweater"]
footwear_types = ["Sneakers", "Boots", "Sandals", "Running Shoes"]
accessory_types = ["Wallet", "Cap", "Sunglasses", "Backpack", "Watch"]

colors = ["White", "Black", "Red", "Blue", "Green", "Gray", "Yellow"]
sizes = ["S", "M", "L", "XL"]

products = []

for i in range(1, 1001):
    category = random.choice(categories)
    
    if category == "Clothing":
        p_type = random.choice(clothing_types)
    elif category == "Footwear":
        p_type = random.choice(footwear_types)
    else:
        p_type = random.choice(accessory_types)
    
    num_variants = random.randint(1, 3)
    variants = []
    for _ in range(num_variants):
        color = random.choice(colors)
        size_inventory = {size: random.randint(0, 50) for size in sizes}
        variants.append({"color": color, "sizes": size_inventory})
    
    price = round(random.uniform(10.0, 150.0), 2)
    custom_props = {}

    product = {
        "id": i,
        "name": f"{p_type} {i}",
        "category": category,
        "type": p_type,
        "price": price,
        "variants": variants,
        "customProperties": custom_props
    }

    products.append(product)

with open("./productsDataBase.json", "w") as f:
    json.dump(products, f, indent=4)
