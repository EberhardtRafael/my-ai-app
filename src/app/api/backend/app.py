# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from strawberry.flask.views import GraphQLView
from schema import schema  # This is custom
import os
import json
import sqlite3
from github_client import GitHubClient
from ticket_estimator import TicketEstimator
from ticket_generator import TicketGenerator

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

app.add_url_rule(
    "/graphql",
    view_func=GraphQLView.as_view("graphql_view", schema=schema, graphiql=True)  # graphiql=True allows UI for GraphQL queries
)


def _normalize_repo(repo: str) -> str:
    """Normalize repository format to owner/repo"""
    if 'github.com/' in repo:
        repo = repo.split('github.com/')[-1]
    return repo.strip('/').replace('.git', '')


def _assistant_profile_db_path() -> str:
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(data_dir, exist_ok=True)
    return os.path.join(data_dir, 'assistant_profiles.db')


def _init_assistant_profile_db():
    conn = sqlite3.connect(_assistant_profile_db_path())
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS assistant_user_profiles (
            profile_id TEXT PRIMARY KEY,
            profile_json TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()


def _get_assistant_profile(profile_id: str):
    conn = sqlite3.connect(_assistant_profile_db_path())
    cursor = conn.cursor()
    cursor.execute(
        '''
        SELECT profile_json
        FROM assistant_user_profiles
        WHERE profile_id = ?
        ''',
        (profile_id,),
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    try:
        return json.loads(row[0])
    except Exception:
        return None


def _save_assistant_profile(profile_id: str, profile):
    conn = sqlite3.connect(_assistant_profile_db_path())
    cursor = conn.cursor()
    cursor.execute(
        '''
        INSERT INTO assistant_user_profiles (profile_id, profile_json, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(profile_id) DO UPDATE SET
            profile_json=excluded.profile_json,
            updated_at=CURRENT_TIMESTAMP
        ''',
        (profile_id, json.dumps(profile)),
    )
    conn.commit()
    conn.close()


_init_assistant_profile_db()

# Ticket generation endpoint
@app.route("/api/tickets/generate", methods=["POST"])
def generate_ticket():
    try:
        data = request.json
        
        # Validate required fields
        repo = data.get('repo')
        github_token = data.get('github_token')
        task_description = data.get('task_description')
        context = data.get('context', 'full-stack')
        
        if not repo or not github_token or not task_description:
            return jsonify({"error": "Missing required fields: repo, github_token, task_description"}), 400
        
        # Parse repo name (handle different formats)
        repo = _normalize_repo(repo)
        
        # Initialize clients
        github_client = GitHubClient(github_token)
        estimator = TicketEstimator()
        generator = TicketGenerator()
        
        # Fetch repository data
        print(f"Fetching data for repo: {repo}")
        repo_stats = github_client.fetch_repository_stats(repo)
        historical_tasks = github_client.get_historical_tasks(repo)
        
        # Generate estimation
        print("Generating estimation...")
        estimation = estimator.estimate(
            task_description=task_description,
            context=context,
            repo_metrics=repo_stats.get('metrics'),
            historical_tasks=historical_tasks
        )
        
        # Find similar tasks
        similar_tasks = estimator.find_similar_tasks(task_description, historical_tasks)
        
        # Generate ticket
        print("Generating ticket...")
        ticket_markdown = generator.generate(
            task_description=task_description,
            context=context,
            estimation=estimation,
            repo_metrics=repo_stats.get('metrics'),
            similar_tasks=similar_tasks
        )
        
        # Extract ticket ID and title from markdown
        lines = ticket_markdown.split('\n')
        first_line = lines[0].replace('#', '').strip()
        ticket_id = first_line.split(':')[0].strip() if ':' in first_line else 'TICKET-001'
        title = first_line.split(':', 1)[1].strip() if ':' in first_line else first_line
        
        response = {
            "ticket": {
                "id": ticket_id,
                "title": title,
                "markdown": ticket_markdown,
                "estimation": estimation,
                "similar_tasks": similar_tasks[:3] if similar_tasks else []
            },
            "repo_stats": {
                "repo_name": repo,
                "avg_time_to_merge": repo_stats.get('metrics', {}).get('avg_time_to_merge_hours', 0),
                "total_branches_analyzed": len(historical_tasks),
                "cache_age": "fresh"
            }
        }

        github_client.save_ticket_history(
            repo_name=repo,
            ticket=response["ticket"],
            task_description=task_description,
            context=context,
            repo_stats=repo_stats,
        )
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"Error generating ticket: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/tickets/history", methods=["GET"])
def get_ticket_history():
    try:
        repo = request.args.get("repo")
        github_token = request.args.get("github_token")

        if not repo or not github_token:
            return jsonify({"error": "Missing required query params: repo and github_token"}), 400

        normalized_repo = _normalize_repo(repo)
        github_client = GitHubClient(github_token)
        history = github_client.get_ticket_history(normalized_repo)

        return jsonify({"repo": normalized_repo, "history": history}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/tickets/stats", methods=["GET"])
def get_ticket_stats():
    try:
        repo = request.args.get("repo")
        github_token = request.args.get("github_token")

        if not repo or not github_token:
            return jsonify({"error": "Missing required query params: repo and github_token"}), 400

        normalized_repo = _normalize_repo(repo)
        github_client = GitHubClient(github_token)
        stats = github_client.get_ticket_statistics(normalized_repo)

        return jsonify({"repo": normalized_repo, "stats": stats}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/assistant/profile/<profile_id>", methods=["GET"])
def get_assistant_profile(profile_id):
    try:
        profile = _get_assistant_profile(profile_id)
        return jsonify({"profile": profile}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/assistant/profile", methods=["POST"])
def save_assistant_profile():
    try:
        data = request.json or {}
        profile_id = data.get("profile_id")
        profile = data.get("profile")

        if not profile_id or profile is None:
            return jsonify({"error": "Missing required fields: profile_id and profile"}), 400

        _save_assistant_profile(profile_id, profile)
        return jsonify({"ok": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("BACKEND_PORT", 8000))
    app.run(debug=True, port=port)
