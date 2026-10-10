from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AgentBreak: Autonomous AI Red Team Testing Platform",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "agentbreak-backend",
        "version": settings.VERSION,
    }

@app.get(f"{settings.API_V1_STR}/health")
def api_v1_health_check():
    return {
        "status": "ok",
        "service": "agentbreak-backend",
        "version": settings.VERSION,
        "storage": {
            "data_dir_exists": settings.DATA_DIR.exists(),
            "traces_dir_exists": settings.TRACES_DIR.exists(),
            "blocklist_exists": settings.BLOCKLIST_PATH.exists(),
        }
    }

@app.get("/")
def root():
    return {
        "message": "AgentBreak API Service is active",
        "docs_url": "/docs",
        "health_url": "/health",
    }
