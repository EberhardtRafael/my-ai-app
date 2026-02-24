# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from strawberry.flask.views import GraphQLView
from schema import schema  # This is custom
import os
from github_client import GitHubClient
from ticket_estimator import TicketEstimator
from ticket_generator import TicketGenerator

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

app.add_url_rule(
    "/graphql",
    view_func=GraphQLView.as_view("graphql_view", schema=schema, graphiql=True)  # graphiql=True allows UI for GraphQL queries
)

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
        if 'github.com/' in repo:
            repo = repo.split('github.com/')[-1]
        repo = repo.strip('/').replace('.git', '')
        
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
                "avg_time_to_merge": repo_stats.get('metrics', {}).get('avg_time_to_merge_hours', 0),
                "total_branches_analyzed": len(historical_tasks),
                "cache_age": "fresh"
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"Error generating ticket: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("BACKEND_PORT", 8000))
    app.run(debug=True, port=port)
