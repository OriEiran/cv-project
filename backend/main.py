from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import health, detect, track
from .models import SUPPORTED_MODELS

app = FastAPI(title="CV Lab API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(detect.router)
app.include_router(track.router)


@app.get("/models")
def list_models():
    return {"models": list(SUPPORTED_MODELS.keys())}
