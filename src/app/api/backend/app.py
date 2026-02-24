# app.py
from flask import Flask
from strawberry.flask.views import GraphQLView
from schema import schema  # This is custom
import os

app = Flask(__name__)

app.add_url_rule(
    "/graphql",
    view_func=GraphQLView.as_view("graphql_view", schema=schema, graphiql=True)  # graphiql=True allows UI for GraphQL queries
)

if __name__ == "__main__":
    port = int(os.environ.get("BACKEND_PORT", 8000))
    app.run(debug=True, port=port)
