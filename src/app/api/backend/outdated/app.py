from flask import Flask, request, jsonify
from schema import schema  # This is customized

app = Flask(__name__)

@app.route("/graphql", methods=["POST"])
def graphql():
    data = request.get_json()
    if not data or "query" not in data:
        return jsonify({"error": "No query found"}), 400

    result = schema.execute(
        data["query"],
        variable_values=data.get("variables")
    )
    return jsonify(result.to_dict())

if __name__ == "__main__":
    app.run(debug=True) #Never use debugger true in production!
