import os

class Settings:
    # --- JWT Config ---
    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", "your-default-insecure-secret-key-for-dev-only")  # **DEV ONLY!**
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 15))

    # --- Redis Config ---
    REDIS_URL: str = os.environ.get("REDIS_URL", "redis://localhost:6379/")
    REDIS_PASSWORD: str | None = os.environ.get("REDIS_PASSWORD", None)
    REDIS_DB: int = int(os.environ.get("REDIS_DB", 0))

    # --- MongoDB Config ---
    MONGODB_URI: str = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")

    # --- App Config ---
    DEBUG_MODE: bool = os.environ.get("DEBUG_MODE", "false").lower() == "true"
    LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "INFO")
    API_VERSION: str = "v1"
    FRONTEND_URL: str = os.environ.get("FRONTEND_URL", "http://localhost:3000")

# Khởi tạo 1 instance duy nhất để import ở nơi khác
settings = Settings()
