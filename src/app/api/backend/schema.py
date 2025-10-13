# schema.py
import strawberry
from typing import List
from models import Product, Variant, session
from sqlalchemy import or_

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
    def products(self, searchTerm: str = None, category: str = None, color: str = None, offset: int = None, limit: int = None) -> List[ProductType]:
        
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
        return session.query(Product).get(id)

schema = strawberry.Schema(query=Query)
