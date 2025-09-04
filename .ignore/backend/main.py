"""
backend/main.py
Flask app that serves the SPA frontend and runs graph algorithms.

Run locally:
    python -m backend.main
or
    flask --app backend.main run
"""
from __future__ import annotations

import pathlib
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# ── Paths ────────────────────────────────────────────────────────────
ROOT = pathlib.Path(__file__).resolve().parent
FRONTEND_DIR = ROOT.parent / "frontend"

# ── Import algorithms ────────────────────────────────────────────────
# After you rename your algo files to snake_case (bfs.py, dfs.py, dijkstra.py)
from algos.algorithms import bfs, dfs, dijkstra  # noqa: E402

ALGO_MAP = {
    "bfs": bfs,
    "dfs": dfs,
    "dijkstra": dijkstra,
}

# ── Factory so tests and prod share the same app instance ────────────
def create_app() -> Flask:
    app = Flask(
        __name__,
        static_folder=str(FRONTEND_DIR),  # serves everything in /frontend
        static_url_path="",               # so "/" hits index.html
    )
    CORS(app)  # tighten origins in prod

    # ── API route ────────────────────────────────────────────────────
    @app.post("/api/run")
    def run_algorithm():
        data = request.get_json(silent=True) or {}
        graph = data.get("graph")
        start = data.get("start")
        algo_name = (data.get("algo") or "dijkstra").lower()

        # ---- Validation ------------------------------------------------
        if not graph or not start:
            return jsonify(error="Fields 'graph' and 'start' are required"), 400
        if algo_name not in ALGO_MAP:
            return jsonify(error=f"Unknown algorithm '{algo_name}'"), 400
        if start not in graph:
            return jsonify(error=f"Start node '{start}' not present in graph"), 400
        if any(neigh not in graph for nbrs in graph.values() for neigh in nbrs):
            return jsonify(error="Graph contains edges to undefined nodes"), 400

        # ---- Run the algorithm ----------------------------------------
        try:
            result = ALGO_MAP[algo_name](graph, start)
            return jsonify(result)
        except Exception as exc:
            app.logger.exception(exc)      # full stack-trace in the server log
            return jsonify(error="Internal server error"), 500

    # ── Single-Page-App fall-through routes ──────────────────────────
    @app.route("/")
    def index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.route("/<path:path>")
    def static_proxy(path: str):
        # If the requested file exists, serve it; otherwise fall back to index.html
        target = FRONTEND_DIR / path
        if target.is_file():
            return send_from_directory(FRONTEND_DIR, path)
        return send_from_directory(FRONTEND_DIR, "index.html")

    return app


# ── CLI convenience ─────────────────────────────────────────────────
if __name__ == "__main__":
    create_app().run(debug=True)
