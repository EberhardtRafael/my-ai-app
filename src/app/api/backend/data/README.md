# Cache Directory

This directory stores the SQLite database for caching GitHub repository data.

The cache helps to:
- Reduce GitHub API calls (rate limit: 5000/hour)
- Speed up subsequent ticket generations
- Store historical analysis

## Files

- `repo_cache.db` - SQLite database (auto-created on first use)

## Cache Validity

- Default: 24 hours
- Refresh: Data older than 24h is re-fetched from GitHub
- Manual clear: Delete `repo_cache.db` to force refresh

## Database Schema

### repo_cache table
- `repo_name` (TEXT, PRIMARY KEY)
- `data` (TEXT) - JSON serialized repo stats
- `cached_at` (TIMESTAMP)

### branch_history table
- `repo_name` (TEXT)
- `branch_name` (TEXT)
- `created_at`, `merged_at` (TIMESTAMP)
- `time_to_merge_hours` (REAL)
- `pr_number`, `commits_count`, `files_changed` (INTEGER)
- `additions`, `deletions` (INTEGER)
