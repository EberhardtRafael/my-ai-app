# app.py
from flask import Flask
from strawberry.flask.views import GraphQLView
from schema import schema #This is custom

app = Flask(__name__)

app.add_url_rule(
    "/graphql",
    view_func=GraphQLView.as_view("graphql_view", schema=schema, graphiql=True) # graphiql=True allows UI for GraphQL queries
)

if __name__ == "__main__":
    app.run(debug=True)
