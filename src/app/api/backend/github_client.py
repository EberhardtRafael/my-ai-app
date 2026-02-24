"""
GitHub API client for fetching repository history and metrics
"""
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import sqlite3
import json
import os

class GitHubClient:
    def __init__(self, token: str):
        self.token = token
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        self.db_path = os.path.join(os.path.dirname(__file__), 'data', 'repo_cache.db')
        self._init_db()
    
    def _init_db(self):
        """Initialize SQLite database for caching"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS repo_cache (
                repo_name TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS branch_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repo_name TEXT NOT NULL,
                branch_name TEXT NOT NULL,
                created_at TIMESTAMP,
                merged_at TIMESTAMP,
                time_to_merge_hours REAL,
                pr_number INTEGER,
                commits_count INTEGER,
                files_changed INTEGER,
                additions INTEGER,
                deletions INTEGER,
                UNIQUE(repo_name, branch_name)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def _get_cached_data(self, repo_name: str, max_age_hours: int = 24) -> Optional[Dict]:
        """Get cached repository data if fresh enough"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT data, cached_at FROM repo_cache 
            WHERE repo_name = ? 
            AND datetime(cached_at) > datetime('now', ?)
        ''', (repo_name, f'-{max_age_hours} hours'))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return json.loads(result[0])
        return None
    
    def _cache_data(self, repo_name: str, data: Dict):
        """Cache repository data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO repo_cache (repo_name, data, cached_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        ''', (repo_name, json.dumps(data)))
        
        conn.commit()
        conn.close()
    
    def fetch_repository_stats(self, repo_name: str, use_cache: bool = True) -> Dict[str, Any]:
        """
        Fetch comprehensive repository statistics
        Args:
            repo_name: Format "owner/repo"
            use_cache: Whether to use cached data
        Returns:
            Dictionary with repo stats and historical data
        """
        if use_cache:
            cached = self._get_cached_data(repo_name)
            if cached:
                return cached
        
        stats = {
            "repo_name": repo_name,
            "branches": self._fetch_branches(repo_name),
            "pull_requests": self._fetch_pull_requests(repo_name),
            "commits": self._fetch_recent_commits(repo_name),
            "metrics": {}
        }
        
        # Calculate metrics
        stats["metrics"] = self._calculate_metrics(stats)
        
        # Cache the results
        self._cache_data(repo_name, stats)
        
        return stats
    
    def _fetch_branches(self, repo_name: str) -> List[Dict]:
        """Fetch all branches"""
        url = f"{self.base_url}/repos/{repo_name}/branches"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def _fetch_pull_requests(self, repo_name: str, state: str = "all", max_results: int = 100) -> List[Dict]:
        """Fetch pull requests with their details"""
        url = f"{self.base_url}/repos/{repo_name}/pulls"
        params = {"state": state, "per_page": min(max_results, 100), "sort": "updated", "direction": "desc"}
        
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        pulls = response.json()
        
        # Store in database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for pr in pulls:
            if pr.get('merged_at'):
                created_at = datetime.fromisoformat(pr['created_at'].replace('Z', '+00:00'))
                merged_at = datetime.fromisoformat(pr['merged_at'].replace('Z', '+00:00'))
                time_to_merge = (merged_at - created_at).total_seconds() / 3600
                
                cursor.execute('''
                    INSERT OR REPLACE INTO branch_history 
                    (repo_name, branch_name, created_at, merged_at, time_to_merge_hours, 
                     pr_number, commits_count, files_changed, additions, deletions)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    repo_name,
                    pr['head']['ref'],
                    pr['created_at'],
                    pr['merged_at'],
                    time_to_merge,
                    pr['number'],
                    pr.get('commits', 0),
                    pr.get('changed_files', 0),
                    pr.get('additions', 0),
                    pr.get('deletions', 0)
                ))
        
        conn.commit()
        conn.close()
        
        return pulls
    
    def _fetch_recent_commits(self, repo_name: str, max_results: int = 100) -> List[Dict]:
        """Fetch recent commits"""
        url = f"{self.base_url}/repos/{repo_name}/commits"
        params = {"per_page": min(max_results, 100)}
        
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()
    
    def _calculate_metrics(self, stats: Dict) -> Dict[str, Any]:
        """Calculate useful metrics from fetched data"""
        pulls = stats.get("pull_requests", [])
        
        merged_pulls = [p for p in pulls if p.get('merged_at')]
        
        if not merged_pulls:
            return {
                "avg_time_to_merge_hours": 0,
                "median_time_to_merge_hours": 0,
                "total_merged_prs": 0,
                "avg_commits_per_pr": 0,
                "avg_files_changed": 0
            }
        
        times_to_merge = []
        commits_counts = []
        files_changed_counts = []
        
        for pr in merged_pulls:
            created = datetime.fromisoformat(pr['created_at'].replace('Z', '+00:00'))
            merged = datetime.fromisoformat(pr['merged_at'].replace('Z', '+00:00'))
            time_diff = (merged - created).total_seconds() / 3600
            times_to_merge.append(time_diff)
            commits_counts.append(pr.get('commits', 0))
            files_changed_counts.append(pr.get('changed_files', 0))
        
        times_to_merge.sort()
        median_idx = len(times_to_merge) // 2
        
        return {
            "avg_time_to_merge_hours": round(sum(times_to_merge) / len(times_to_merge), 2),
            "median_time_to_merge_hours": round(times_to_merge[median_idx], 2),
            "total_merged_prs": len(merged_pulls),
            "avg_commits_per_pr": round(sum(commits_counts) / len(commits_counts), 2),
            "avg_files_changed": round(sum(files_changed_counts) / len(files_changed_counts), 2),
            "min_time_to_merge_hours": round(min(times_to_merge), 2),
            "max_time_to_merge_hours": round(max(times_to_merge), 2)
        }
    
    def get_historical_tasks(self, repo_name: str) -> List[Dict]:
        """Get historical branch/PR data from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT branch_name, created_at, merged_at, time_to_merge_hours,
                   commits_count, files_changed, additions, deletions
            FROM branch_history
            WHERE repo_name = ? AND merged_at IS NOT NULL
            ORDER BY merged_at DESC
        ''', (repo_name,))
        
        columns = [desc[0] for desc in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        return results
