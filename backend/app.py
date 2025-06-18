from flask import Flask, request, jsonify
from flask_cors import CORS
from dijkstra import dijkstra
import traceback

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from your frontend

@app.route('/api/run_dijkstra', methods=['POST'])
def run_dijkstra_endpoint():
    try:
        data = request.get_json()
        print("Received JSON:", data)

        graph = data.get("graph")
        start = data.get("start")
        print("Parsed start node:", start)

        if not graph or not start:
            return jsonify({"error": "Please enter a valid graph and starting node."}), 400

        if start not in graph:
            return jsonify({"error": f"Start node '{start}' not found in the graph."}), 400

        # Optional: check that all neighbor nodes exist
        for node, neighbors in graph.items():
            for neighbor in neighbors:
                if neighbor not in graph:
                    return jsonify({"error": f"Graph contains edge to undefined node '{neighbor}'."}), 400

        result = dijkstra(graph, start)
        return jsonify(result)

    except Exception as e:
        print("Exception occurred:", e)
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(debug=True)

