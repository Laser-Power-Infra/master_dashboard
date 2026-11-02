# FastAPI (Python)
# Add to main.py. The dashboard pings GET http://<ip>:<port>/api/health every 30s.
# Run with CORS if you plan to read the JSON body later:
#   from fastapi.middleware.cors import CORSMiddleware
#   app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
from fastapi import FastAPI

app = FastAPI()


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        # ISO time of your last successful data sync (None if unknown); the portal alerts when it is too old
        "lastSync": None,
        "dependencies": {},  # e.g. {"db": "ok", "gmail": "ok"}
    }
