from sqlalchemy import create_engine, Column, Integer, String, Float, Table, MetaData
from sqlalchemy import insert
import json

with open("/home/sarate/Dev/NextJs/my-ai-app/src/app/api/backend/productsDataBase.json") as f:
    products = json.load(f)
    
# Create SQLite engine
engine = create_engine("sqlite:///products.db", echo=True)
metadata = MetaData()

# Define the products table
products_table = Table(
    'products', metadata,
    Column('id', Integer, primary_key=True),
    Column('name', String),
    Column('category', String),
    Column('type', String),
    Column('price', Float),
    Column('variants', String),
    Column('customProperties', String),
)

# Drop the table if it already exists
products_table.drop(engine, checkfirst=True)
# Then recreate it
metadata.create_all(engine)

# Insert mock data
with engine.connect() as conn:
    for p in products:
        stmt = insert(products_table).values(
            id=p["id"],
            name=p["name"],
            category=p["category"],
            type=p["type"],
            price=p["price"],
            variants=json.dumps(p["variants"]),
            customProperties=json.dumps(p["customProperties"])
        )
        conn.execute(stmt)
    conn.commit()

print("Database populated successfully!")