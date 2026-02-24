#!/bin/bash

# Reset all product ratings to zero since we have no actual reviews

cd "$(dirname "$0")"

echo "🔄 Resetting all product ratings to zero..."

sqlite3 database.db << 'EOF'
UPDATE products 
SET rating_avg = 0.0,
    rating_count = 0
WHERE 1=1;

SELECT '✅ Updated ' || changes() || ' products';
SELECT 'Sample check - First 5 products:';
SELECT id, name, rating_avg, rating_count FROM products LIMIT 5;
EOF

echo ""
echo "✅ All product ratings reset to zero!"
echo "📊 Ratings will now build organically from actual user reviews"
