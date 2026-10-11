from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgentBreak API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Paths (trace files kept on disk for fast local read)
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    TRACES_DIR: Path = DATA_DIR / "traces"
    BLOCKLIST_PATH: Path = DATA_DIR / "blocklist.txt"

    # Database — must be a PostgreSQL connection string
    DATABASE_URL: str = ""

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    # Allows Vercel preview deployments without requiring a backend redeploy
    # for every generated preview URL.
    CORS_ORIGIN_REGEX: str = r"https://[a-zA-Z0-9-]+\.vercel\.app"

    # Security & Thresholds
    REFUND_APPROVAL_THRESHOLD: float = 50.0
    REFUND_HARD_LIMIT: float = 500.0

    # Model defaults
    DEFAULT_MODEL_ADAPTER: str = "mock"
    GEMINI_MODEL_NAME: str = "gemini-2.5-flash"

    # Supabase Auth (optional — enables JWT-based user authentication)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"

    # Legacy API key auth (fallback)
    API_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

# Ensure local trace/data directories exist (read-only assets, not DB)
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.TRACES_DIR.mkdir(parents=True, exist_ok=True)
