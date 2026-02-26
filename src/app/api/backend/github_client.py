"""
GitHub API client for fetching repository history and metrics
"""
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import sqlite3
import json
import os
import statistics
import re
from difflib import SequenceMatcher

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

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ticket_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repo_name TEXT NOT NULL,
                ticket_id TEXT NOT NULL,
                title TEXT NOT NULL,
                context TEXT,
                task_description TEXT,
                estimated_hours REAL,
                estimate_low REAL,
                estimate_high REAL,
                confidence REAL,
                predicted_commits REAL,
                github_commits_overall_snapshot INTEGER,
                merged_prs_snapshot INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    def save_ticket_history(
        self,
        repo_name: str,
        ticket: Dict[str, Any],
        task_description: str,
        context: str,
        repo_stats: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Persist generated ticket data for future analysis"""
        estimation = ticket.get("estimation", {})
        metrics = (repo_stats or {}).get("metrics", {})
        commits = (repo_stats or {}).get("commits", [])
        normalized_task = " ".join((task_description or "").lower().split())
        normalized_title = self._normalize_ticket_title(ticket.get("title", ""), normalized_task)
        new_fingerprint = self._task_fingerprint(normalized_task)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute(
            '''
            SELECT task_description, title
            FROM ticket_history
            WHERE repo_name = ?
              AND context = ?
              AND datetime(created_at) > datetime('now', '-24 hours')
            ORDER BY datetime(created_at) DESC
            LIMIT 50
            ''',
            (repo_name, context),
        )

        existing_recent = cursor.fetchall()
        for existing_task, existing_title in existing_recent:
            existing_task_normalized = " ".join(((existing_task or "").lower()).split())
            existing_title_normalized = self._normalize_ticket_title(
                existing_title or "",
                existing_task_normalized,
            )

            exact_match = existing_task_normalized == normalized_task
            fingerprint_match = (
                new_fingerprint
                and self._task_fingerprint(existing_task_normalized) == new_fingerprint
            )
            task_similarity = SequenceMatcher(None, normalized_task, existing_task_normalized).ratio()
            title_similarity = SequenceMatcher(
                None,
                normalized_title.lower(),
                existing_title_normalized.lower(),
            ).ratio()

            if exact_match or fingerprint_match or (task_similarity >= 0.88 and title_similarity >= 0.9):
                conn.close()
                return

        cursor.execute(
            '''
            INSERT INTO ticket_history (
                repo_name,
                ticket_id,
                title,
                context,
                task_description,
                estimated_hours,
                estimate_low,
                estimate_high,
                confidence,
                predicted_commits,
                github_commits_overall_snapshot,
                merged_prs_snapshot
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                repo_name,
                ticket.get("id", "UNKNOWN"),
                normalized_title,
                context,
                normalized_task,
                estimation.get("hours", 0),
                estimation.get("range", [0, 0])[0],
                estimation.get("range", [0, 0])[1],
                estimation.get("confidence", 0),
                metrics.get("avg_commits_per_pr", 0),
                len(commits),
                metrics.get("total_merged_prs", 0),
            ),
        )

        conn.commit()
        conn.close()

    def get_ticket_history(self, repo_name: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Return ticket generation history for a repository"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(
            '''
            SELECT
                id,
                ticket_id,
                title,
                task_description,
                context,
                estimated_hours,
                estimate_low,
                estimate_high,
                confidence,
                predicted_commits,
                github_commits_overall_snapshot,
                merged_prs_snapshot,
                created_at
            FROM ticket_history
            WHERE repo_name = ?
            ORDER BY datetime(created_at) DESC
            LIMIT ?
            ''',
            (repo_name, limit),
        )

        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()

        deduped_rows: List[Dict[str, Any]] = []
        seen_ticket_ids = set()
        seen_title_dates = set()

        for row in rows:
            ticket_id = row.get("ticket_id")
            if ticket_id and ticket_id in seen_ticket_ids:
                continue

            if ticket_id:
                seen_ticket_ids.add(ticket_id)

            row["title"] = self._normalize_ticket_title(
                row.get("title", ""),
                row.get("task_description", ""),
            )

            created_at = str(row.get("created_at") or "")
            created_date = created_at[:10] if len(created_at) >= 10 else "unknown"
            title_date_key = (row["title"].lower(), created_date)

            if title_date_key in seen_title_dates:
                continue

            seen_title_dates.add(title_date_key)
            deduped_rows.append(row)

        return deduped_rows

    def _normalize_ticket_title(self, title: str, task_description: str) -> str:
        """Improve readability of legacy/generated titles."""
        source = (title or '').strip()
        description = (task_description or '').strip()

        haystack = f"{source} {description}".lower()
        if 'related products' in haystack and 'pdp' in haystack:
            return 'Implement related products section on PDP'

        candidate = source or description
        if not candidate:
            return 'New Feature Implementation'

        candidate = candidate.split('.')[0].split('\n')[0]
        candidate = re.sub(
            r'^(please\s+|can you\s+|i want to\s+|i need to\s+|we need to\s+|let\'s\s+)',
            '',
            candidate,
            flags=re.IGNORECASE,
        )
        candidate = re.split(
            r'\b(which means|that means|then|basically)\b',
            candidate,
            flags=re.IGNORECASE,
        )[0]
        candidate = re.sub(r'\s+', ' ', candidate).strip(' ,.-:')

        words = candidate.split()
        if len(words) > 10:
            candidate = ' '.join(words[:10])

        if not candidate:
            return 'New Feature Implementation'

        return candidate[0].upper() + candidate[1:]

    def _task_fingerprint(self, text: str) -> str:
        """Create a compact semantic fingerprint from task text for duplicate detection."""
        stop_words = {
            'the', 'and', 'that', 'this', 'with', 'from', 'have', 'will', 'then', 'into',
            'your', 'gonna', 'going', 'want', 'need', 'create', 'build', 'make', 'ticket',
            'section', 'among', 'which', 'means', 'basically', 'mini', 'version'
        }

        tokens = re.findall(r'[a-z0-9]+', (text or '').lower())
        meaningful_tokens = sorted({token for token in tokens if len(token) > 2 and token not in stop_words})

        return '|'.join(meaningful_tokens[:20])

    def get_ticket_statistics(self, repo_name: str) -> Dict[str, Any]:
        """Aggregate ticket and GitHub history metrics for planning"""
        ticket_history = self.get_ticket_history(repo_name, limit=200)
        historical_tasks = self.get_historical_tasks(repo_name)

        ticket_count = len(ticket_history)
        estimated_hours = [
            float(t.get("estimated_hours") or 0) for t in ticket_history if t.get("estimated_hours")
        ]
        predicted_commits = [
            float(t.get("predicted_commits") or 0) for t in ticket_history if t.get("predicted_commits")
        ]

        actual_merge_times = [
            float(task.get("time_to_merge_hours") or 0)
            for task in historical_tasks
            if task.get("time_to_merge_hours")
        ]
        actual_commits = [
            int(task.get("commits_count") or 0)
            for task in historical_tasks
            if task.get("commits_count") is not None
        ]

        overall_commits = sum(actual_commits)
        median_actual = statistics.median(actual_merge_times) if actual_merge_times else 0
        p90_actual = (
            statistics.quantiles(actual_merge_times, n=10)[8]
            if len(actual_merge_times) >= 10
            else (max(actual_merge_times) if actual_merge_times else 0)
        )

        forecast_hours = 0
        if estimated_hours and actual_merge_times:
            forecast_hours = round(
                (statistics.mean(estimated_hours) * 0.6) + (statistics.mean(actual_merge_times) * 0.4),
                2,
            )
        elif estimated_hours:
            forecast_hours = round(statistics.mean(estimated_hours), 2)
        elif actual_merge_times:
            forecast_hours = round(statistics.mean(actual_merge_times), 2)

        velocity_per_week = 0
        if ticket_count >= 2:
            created_times = [
                datetime.fromisoformat(t["created_at"]) for t in ticket_history if t.get("created_at")
            ]
            if len(created_times) >= 2:
                span_hours = max((max(created_times) - min(created_times)).total_seconds() / 3600, 1)
                velocity_per_week = round((ticket_count / span_hours) * 24 * 7, 2)

        return {
            "repo_name": repo_name,
            "tickets_generated": ticket_count,
            "github_commits_overall": overall_commits,
            "avg_commits_per_ticket": round(statistics.mean(predicted_commits), 2)
            if predicted_commits
            else 0,
            "avg_estimated_hours_per_ticket": round(statistics.mean(estimated_hours), 2)
            if estimated_hours
            else 0,
            "avg_actual_merge_time_hours": round(statistics.mean(actual_merge_times), 2)
            if actual_merge_times
            else 0,
            "median_actual_merge_time_hours": round(median_actual, 2) if median_actual else 0,
            "p90_actual_merge_time_hours": round(p90_actual, 2) if p90_actual else 0,
            "forecast_hours_next_ticket": forecast_hours,
            "ticket_velocity_per_week": velocity_per_week,
            "historical_prs_analyzed": len(historical_tasks),
        }
