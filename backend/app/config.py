import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    DATABASE_URL: str = (
        "sqlite:////tmp/echotrace.db" if os.getenv("VERCEL") else "sqlite:///./echotrace.db"
    )
    CORS_ORIGINS: str = "http://localhost:5173"
    DEBUG: bool = False
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


settings = Settings()
