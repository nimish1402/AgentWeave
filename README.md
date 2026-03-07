# AgentWeave 🕸️

**AI-Powered Automation Workflow Platform** — describe your automation in natural language, and let AI generate a visual, executable workflow.

## 🚀 Features

- **AI Workflow Generation** — Describe workflows in plain English; Groq LLM generates a structured JSON workflow
- **Visual Node Editor** — React Flow-based drag-and-drop canvas with 11 built-in node types
- **Workflow Execution Engine** — BFS graph traversal engine executes nodes sequentially, passing context between steps
- **Execution Logs** — Per-node start/success/error logs stored in the database
- **CRUD Workflows** — Save, update, delete, and re-run workflows
- **Dark Mode UI** — Premium dark design with glassmorphism, Tailwind CSS

## 🛠️ Tech Stack

| Layer       | Tech                          |
|-------------|-------------------------------|
| Frontend    | Next.js 14, TypeScript, React Flow, Zustand, Tailwind CSS |
| Backend     | FastAPI, Python, Pydantic, SQLAlchemy |
| Database    | Neon DB (PostgreSQL)          |
| AI          | Groq API (LLaMA 3 70B)        |
| Container   | Docker + docker-compose       |

## 📁 Project Structure

```
AgentWeave/
├── backend/
│   ├── main.py                  # FastAPI app
│   ├── database.py              # SQLAlchemy setup
│   ├── models.py                # ORM models (Workflow, WorkflowRun)
│   ├── schemas.py               # Pydantic schemas
│   ├── routers/workflows.py     # All API endpoints
│   └── services/
│       ├── ai_generator.py      # Groq LLM integration
│       └── execution_engine.py  # BFS workflow runner
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx         # Dashboard
│       │   ├── generate/page.tsx# AI Generator
│       │   └── editor/[id]/page.tsx  # React Flow editor
│       ├── components/
│       │   ├── layout/Sidebar.tsx
│       │   └── workflow/WorkflowNode.tsx
│       ├── store/workflowStore.ts
│       └── lib/api.ts
└── docker-compose.yml
```

## ⚙️ Setup

### 1. Environment Variables

**Backend** — create `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@host/dbname
GROQ_API_KEY=gsk_your_groq_api_key
```

**Frontend** — `frontend/.env.local` is pre-configured:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 2. Run with Docker

```bash
docker-compose up --build
```

### 3. Run Manually

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate-workflow` | AI-generate a workflow from a prompt |
| `POST` | `/api/workflows` | Create a workflow |
| `GET`  | `/api/workflows` | List all workflows |
| `GET`  | `/api/workflows/{id}` | Get a workflow |
| `PUT`  | `/api/workflows/{id}` | Update a workflow |
| `DELETE` | `/api/workflows/{id}` | Delete a workflow |
| `POST` | `/api/run-workflow/{id}` | Execute a workflow |
| `GET`  | `/api/workflows/{id}/runs` | Get execution history |

## 🔧 Supported Node Types

| Category | Types |
|----------|-------|
| **Trigger** | `webhook`, `manual_trigger`, `cron` |
| **AI** | `llm`, `ai_agent` |
| **Action** | `http_request`, `slack`, `email`, `database_write` |
| **Logic** | `condition`, `loop` |

## 📸 Pages

- **Dashboard** (`/`) — List, create, and delete workflows
- **AI Generator** (`/generate`) — Natural language → workflow visualization
- **Editor** (`/editor/[id]`) — React Flow canvas with node library, save & run
