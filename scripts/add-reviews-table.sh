#!/bin/bash
# Add reviews table to existing database

echo "🔄 Adding reviews table to database..."

cd "$(dirname "$0")/src/app/api/backend"

# Add the reviews table without dropping existing data
python3 << 'EOF'
from models import Base, engine, session, Review
from sqlalchemy import inspect

print("Checking if reviews table exists...")
inspector = inspect(engine)
existing_tables = inspector.get_table_names()

if 'reviews' not in existing_tables:
    print("Creating reviews table...")
    Review.__table__.create(engine, checkfirst=True)
    print("✅ Reviews table created successfully!")
else:
    print("✅ Reviews table already exists")

# Verify the table was created
inspector = inspect(engine)
if 'reviews' in inspector.get_table_names():
    print("✅ Verification passed: reviews table is present")
    print("\nTable columns:")
    for column in inspector.get_columns('reviews'):
        print(f"  - {column['name']} ({column['type']})")
else:
    print("❌ Error: reviews table was not created")

EOF

echo ""
echo "✅ Database migration complete!"
echo ""
echo "New features available:"
echo "  - Users can submit reviews and ratings"
echo "  - Automatic calculation of average ratings"
echo "  - Verified purchase badges"
echo "  - Helpful votes on reviews"
