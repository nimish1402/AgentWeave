from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import workflows as workflow_router

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AgentWeave API",
    description="AI-Powered Automation Workflow Platform",
    version="1.0.0",
)

# CORS – allow Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workflow_router.router, prefix="/api", tags=["Workflows"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "AgentWeave API"}
