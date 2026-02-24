#!/bin/bash
# Migrate to enhanced product schema with ML attributes

echo "🔄 Migrating database to enhanced schema..."

cd "$(dirname "$0")/src/app/api/backend"

# Backup existing database
if [ -f "products.db" ]; then
    echo "📦 Backing up existing database..."
    cp products.db "products.db.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Reinitialize database with new schema
echo "🗄️  Reinitializing database with enhanced schema..."
python3 << 'EOF'
from models import init_db
print("Creating new schema...")
init_db()
print("✅ Schema created successfully")
EOF

# Seed with realistic product data
echo "🌱 Seeding database with realistic products..."
python3 seed.py

echo "✅ Migration complete!"
echo ""
echo "New product attributes:"
echo "  - description: Full text for NLP/search"
echo "  - brand: For brand-based recommendations"
echo "  - material: Material similarity matching"
echo "  - tags: Quick keyword filtering"
echo "  - rating_avg & rating_count: Quality signals"
echo "  - sales_count: Popularity metrics"
echo "  - image_url: Product images"
echo ""
echo "ML capabilities enabled:"
echo "  ✓ Content-based filtering (TF-IDF on descriptions)"
echo "  ✓ Hybrid recommendations (collaborative + content)"
echo "  ✓ Attribute-based similarity"
echo "  ✓ Cold start solution for new products"
