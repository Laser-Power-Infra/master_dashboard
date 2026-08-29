# FastAPI (Python)
# Add to main.py. The dashboard pings GET http://<ip>:<port>/api/health every 30s.
# Run with CORS if you plan to read the JSON body later:
#   from fastapi.middleware.cors import CORSMiddleware
#   app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
from fastapi import FastAPI
import time

app = FastAPI()

START_TIME = time.time()


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "uptime": round(time.time() - START_TIME, 2),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }