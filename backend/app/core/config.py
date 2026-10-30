import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "HRMind AI"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./hrmind.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretkey")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@hrmind.com")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")

    # Phase 2: RAG & Storage Configuration
    QDRANT_URL: str = os.getenv("QDRANT_URL", ":memory:")
    QDRANT_API_KEY: str | None = os.getenv("QDRANT_API_KEY", None)
    QDRANT_COLLECTION: str = os.getenv("QDRANT_COLLECTION", "hrmind_policies")
    # Multilingual-capable embedding model for Hindi/Hinglish support
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    
    SUPABASE_URL: str | None = os.getenv("SUPABASE_URL", None)
    SUPABASE_KEY: str | None = os.getenv("SUPABASE_KEY", None)
    SUPABASE_STORAGE_BUCKET: str = os.getenv("SUPABASE_STORAGE_BUCKET", "policies")

    # Phase 3: Agent Configuration
    GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY", None)
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

    class Config:
        env_file = ".env"

settings = Settings()

