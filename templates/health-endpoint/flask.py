# Flask (Python)
# Add to app.py. The dashboard pings GET http://<ip>:<port>/api/health every 30s.
from flask import Flask, jsonify

app = Flask(__name__)


@app.route("/api/health")
def health():
    resp = jsonify(
        {
            "status": "ok",
            # ISO time of your last successful data sync (None if unknown); the portal alerts when it is too old
            "lastSync": None,
            "dependencies": {},  # e.g. {"db": "ok", "gmail": "ok"}
        }
    )
    resp.headers["Cache-Control"] = "no-store"
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp
