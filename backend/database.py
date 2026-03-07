from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

_PLACEHOLDER = "postgresql://user:password@host/dbname"
_RAW_URL = os.getenv("DATABASE_URL", "").strip()

def _make_engine():
    """Try the configured DATABASE_URL; fall back to SQLite on any error."""
    if _RAW_URL and _RAW_URL != _PLACEHOLDER:
        try:
            eng = create_engine(_RAW_URL, pool_pre_ping=True)
            # Quick connectivity check
            with eng.connect() as conn:
                conn.execute(text("SELECT 1"))
            print(f"INFO:     Connected to database: {_RAW_URL[:40]}...")
            return eng
        except Exception as exc:
            print(f"WARNING:  Could not connect to DATABASE_URL ({exc}). Falling back to SQLite.")

    sqlite_url = "sqlite:///./agentweave.db"
    print("INFO:     Using SQLite → agentweave.db")
    return create_engine(sqlite_url, connect_args={"check_same_thread": False})

engine = _make_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

