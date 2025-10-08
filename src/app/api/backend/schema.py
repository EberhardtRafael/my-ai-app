# contract between frontend and backend
import graphene
from db import products

# This class is but what I would call an object in JS
class ProductType(graphene.ObjectType):
    id = graphene.Int()
    name = graphene.String()
    category = graphene.String()
    type = graphene.String()
    price = graphene.Float()
    size = graphene.String()
    inventory = graphene.Int()
    customProperties = graphene.String()

class Query(graphene.ObjectType):
    hello = graphene.String(first_name=graphene.String(default_value="stranger"))
    goodbye = graphene.String()
    all_products = graphene.List(ProductType)
    product_by_id = graphene.Field(ProductType, id=graphene.Int(required=True))
    product_by_category = graphene.List(ProductType, category=graphene.String(required=True))

    #The resolve method is proper of the graphene library
    def resolve_hello(root, info, first_name):
        return f'Hello {first_name}!'

    def resolve_goodbye(root, info):
        return 'See ya!'

    def resolve_all_products(root, info):
        return products

    def resolve_product_by_id(root, info, id):
        for p in products:
            if p["id"] == id:
                return p
        return None
    
    def resolve_product_by_category(root, info, category):
        list_by_category = [p for p in products if p["category"] == category]
        return list_by_category or None

schema = graphene.Schema(query=Query)


