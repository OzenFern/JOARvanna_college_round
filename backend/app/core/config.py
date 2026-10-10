import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgentBreak API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    TRACES_DIR: Path = DATA_DIR / "traces"
    BLOCKLIST_PATH: Path = DATA_DIR / "blocklist.txt"
    DB_PATH: Path = DATA_DIR / "agentbreak.db"
    
    # CORS
    CORS_ORIGINS: list[str] = ["*"]
    
    # Security & Thresholds
    REFUND_APPROVAL_THRESHOLD: float = 50.0
    REFUND_HARD_LIMIT: float = 500.0
    
    # Model defaults
    DEFAULT_MODEL_ADAPTER: str = "mock"
    GEMINI_MODEL_NAME: str = "gemini-2.0-flash"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.TRACES_DIR.mkdir(parents=True, exist_ok=True)
