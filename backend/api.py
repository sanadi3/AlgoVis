from flask import send_from_directory, Flask, request, jsonify
from flask_cors import CORS
from algos.algorithms import dijkstra, BFS, DFS
import pathlib

FRONTEND_DIR = pathlib.Path(__file__).parent.parent / "frontend"

app = Flask(__name__)
CORS(app)

ALGO_MAP = {
    "dijkstra": dijkstra.dijkstra,
    "bfs": BFS.bfs,
    "dfs": DFS.dfs,
}
@app.route("/")
def root():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)

@app.post("/api/run")
def run_algorithm():
    data = request.get_json()
    graph = data.get("graph")
    start = data.get("start")
    algo = data.get("algo", "dijkstra").lower()

    if not graph or not start:
        return jsonify(error="graph and start are required"), 400
    if algo not in ALGO_MAP:
        return jsonify(error=f"unknown algo {algo}"), 400
    try:
        result = ALGO_MAP[algo](graph, start)
        return jsonify(result)
    except Exception as e:
        return jsonify(error=str(e)), 500

if __name__ == "__main__":
    app.run(debug=True)