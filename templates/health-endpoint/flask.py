# Flask (Python)
# Add to app.py. The dashboard pings GET http://<ip>:<port>/api/health every 30s.
from flask import Flask, jsonify
import time

app = Flask(__name__)
START_TIME = time.time()


@app.route("/api/health")
def health():
    resp = jsonify(
        {
            "status": "ok",
            "uptime": round(time.time() - START_TIME, 2),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
    )
    resp.headers["Cache-Control"] = "no-store"
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp