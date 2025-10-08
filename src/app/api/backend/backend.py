from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors

app = Flask(__name__)

# Example dataset: items and features
items = pd.DataFrame({
    "item_id": [1, 2, 3, 4, 5],
    "feature1": [0.1, 0.3, 0.2, 0.8, 0.5],
    "feature2": [0.5, 0.7, 0.2, 0.4, 0.9]
})

features = items[["feature1", "feature2"]].values
model = NearestNeighbors(n_neighbors=2, algorithm='ball_tree')
model.fit(features)

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json()
    feature1 = data.get("feature1")
    feature2 = data.get("feature2")
    
    if feature1 is None or feature2 is None:
        return jsonify({"error": "feature1 and feature2 are required"}), 400
    
    user_features = np.array([[feature1, feature2]])
    distances, indices = model.kneighbors(user_features)
    recommended_items = items.iloc[indices[0]].to_dict(orient="records")
    
    return jsonify({"recommendations": recommended_items})

if __name__ == "__main__":
    app.run(debug=True)
