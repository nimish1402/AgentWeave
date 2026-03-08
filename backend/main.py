from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine, Base
from routers import workflows as workflow_router

# Create any missing tables
Base.metadata.create_all(bind=engine)

# ── Idempotent schema migrations ───────────────────────────────────────────────
# SQLAlchemy's create_all() only creates NEW tables — it never alters existing
# ones. These ALTER TABLE statements handle columns added after initial deploy.
with engine.connect() as _conn:
    _conn.execute(text(
        "ALTER TABLE workflows ADD COLUMN IF NOT EXISTS user_id VARCHAR;"
    ))
    _conn.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_workflows_user_id ON workflows (user_id);"
    ))
    _conn.commit()
    print("INFO:     Schema migration complete (user_id column ensured).")

import os

app = FastAPI(
    title="AgentWeave API",
    description="AI-Powered Automation Workflow Platform",
    version="1.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
# ALLOWED_ORIGINS env var = comma-separated list, e.g.:
#   https://agentweave.vercel.app,http://localhost:3000
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workflow_router.router, prefix="/api", tags=["Workflows"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "AgentWeave API"}
