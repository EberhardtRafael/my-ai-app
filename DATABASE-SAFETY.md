# Database Safety Guide

## 🔒 Production-Safe Database Operations

This guide explains how to safely work with the database without losing user data.

## Seed Script Modes

### Safe Mode (Default) ✅

**Usage:** `python3 seed.py`

**What it does:**
- Creates database tables if they don't exist (no data loss)
- **Preserves ALL existing users**
- Only adds demo data if database is empty
- Safe to run anytime, even in production
- Adds missing demo users without duplicating

**Example output:**
```
🔒 SAFE SEED MODE - Preserving existing data
Current database state:
  Users: 5
  Products: 500

⚠️  Database already contains products.
To reseed products, use --force-reseed flag (DESTRUCTIVE)
Only checking/adding demo users...

✓ Demo users already exist
```

### Destructive Mode ⚠️

**Usage:** `python3 seed.py --force-reseed`

**What it does:**
1. Backs up ALL existing users
2. Drops ALL tables (products, orders, reviews, favorites, carts)
3. Recreates tables from scratch
4. **Restores your user accounts** (with original passwords)
5. Adds demo users if missing
6. Seeds fresh product catalog

**Requires confirmation:** You must type 'yes' to proceed.

**Use cases:**
- Development: Testing with fresh product data
- After schema changes: Need clean slate with new structure
- Data corruption: Need to rebuild catalog

**Example:**
```bash
$ python3 seed.py --force-reseed

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
⚠️  WARNING: DESTRUCTIVE OPERATION
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

This will DROP all products, orders, and reviews!
Your user accounts will be preserved.

Type 'yes' to continue: yes

Backing up existing users...
✓ Backed up 5 users

⚠️  Dropping all tables...
✓ Tables recreated

Restoring your user accounts...
✓ Restored 5 existing users

Adding demo users...
✓ Demo users already exist

Seeding products...
✓ Destructive reseed completed!
```

## What Gets Preserved vs Deleted

### Always Preserved ✅
- **User accounts** (username, email, password hash)
- Real user data is backed up before any destructive operation

### Deleted in Destructive Mode ⚠️
- All products and variants
- All orders and order items
- All reviews
- All favorites
- All cart items
- Product relations

## Demo Users

The seed script ensures these demo accounts exist:

| Username | Email | Password |
|----------|-------|----------|
| `test` | test@example.com | `test` |
| `dev` | dev@example.com | `dev` |
| `john` | john@example.com | `password123` |
| `jane` | jane@example.com | `password123` |

These are only added if they don't already exist.

## Best Practices

### For Development
```bash
# First time setup
python3 seed.py

# Need fresh products but keep users
python3 seed.py --force-reseed

# Schema migration
./migrate-schema.sh  # This also preserves users
```

### For Production
```bash
# Only run safe mode in production
python3 seed.py

# NEVER run --force-reseed in production without backups!
```

### After Git Pull
```bash
# Safe: Check if demo users need to be added
python3 seed.py

# This won't touch existing data
```

## Troubleshooting

### "I lost my user account!"
**Cause:** Someone ran the old seed script or destructive operations without backup.

**Solution:** The new seed script (as of 2026-02-26) always backs up and restores users. Update your seed.py if you have an old version.

### "Demo users don't exist"
```bash
python3 seed.py
```
This will add missing demo users without touching existing data.

### "I need to reset products but keep my account"
```bash
python3 seed.py --force-reseed
```
User accounts are automatically backed up and restored.

### "Database is corrupted"
```bash
# Last resort: backup manually first
sqlite3 products.db ".backup backup.db"

# Then reseed
python3 seed.py --force-reseed
```

## Migration Scripts

### migrate-schema.sh
This script has been updated to preserve user data during schema migrations. It backs up users before applying schema changes.

## Related Files
- [src/app/api/backend/seed.py](src/app/api/backend/seed.py) - Seed script
- [src/app/api/backend/models.py](src/app/api/backend/models.py) - Database schema
- [.data/role-overrides.json](.data/role-overrides.json) - Role overrides (separate from DB)
