# contract between frontend and backend
import graphene
from sqlalchemy import create_engine, text

engine = create_engine("sqlite:///products.db", echo=True)

class VariantType(graphene.ObjectType):
    color = graphene.String()
    size = graphene.String()
    stock = graphene.Int()

# This class is but what I would call an object in JS
class ProductType(graphene.ObjectType):
    id = graphene.Int()
    name = graphene.String()
    category = graphene.String()
    type = graphene.String()
    price = graphene.Float()
    size = graphene.String()
    variants = graphene.List(VariantType),
    customProperties = graphene.String()

class Query(graphene.ObjectType):
    hello = graphene.String(first_name=graphene.String(default_value="stranger"))
    goodbye = graphene.String()
    all_products = graphene.List(ProductType)
    product_by_id = graphene.Field(ProductType, id=graphene.Int(required=True))
    product_by_category = graphene.List(ProductType, category=graphene.String(required=False))

    #The resolve method is proper of the graphene library
    def resolve_hello(root, info, first_name):
        return f'Hello {first_name}!'

    def resolve_goodbye(root, info):
        return 'See ya!'

    def resolve_all_products(root, info):
        query = "SELECT * FROM products"
        with engine.connect() as conn:
            result = conn.execute(text(query))
            return [dict(row) for row in result.mappings()]

    def resolve_product_by_id(root, info, id):
        query = "SELECT * FROM products WHERE id = :id"

        with engine.connect() as conn:
            result = conn.execute(text(query), {"id": id})
            row = result.mappings().fetchone()
            return dict(row) if row else None
    
    def resolve_product_by_category(root, info, category=None):
        #if category is not provided, return all
        query = f"SELECT * FROM products{' WHERE category = :category' if category else ''}"
        params = {"category": category} if category else {}

        with engine.connect() as conn:
            result = conn.execute(text(query), params)
            products_list = [dict(row) for row in result.mappings()]

        return products_list

schema = graphene.Schema(query=Query)
