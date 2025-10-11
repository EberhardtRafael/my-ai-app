# schema.py
import strawberry
from typing import List
from models import Product, Variant, session

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
class Query:
    @strawberry.field
    def products(self, category: str = None, color: str = None, offset: int = None, limit: int = None) -> List[ProductType]:
        
        query = session.query(Product)
        if category:
            query = query.filter(Product.category == category)
        if color:
            # join the Variant table and filter by color
            query = query.join(Product.variants).filter(Variant.color == color)
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
        return session.query(Product).get(id)

schema = strawberry.Schema(query=Query)
