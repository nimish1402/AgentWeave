from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
import schemas
from services.ai_generator import generate_workflow
from services.execution_engine import run_workflow
from datetime import datetime
from typing import List

router = APIRouter()


# ── Generate ──────────────────────────────────────────────────────────────────

@router.post("/generate-workflow", response_model=schemas.GenerateWorkflowResponse)
def generate(
    request: schemas.GenerateWorkflowRequest,
    user_id: str = Depends(get_current_user),
):
    """Use Groq AI to generate a workflow JSON from a natural language prompt."""
    try:
        workflow_dict = generate_workflow(request.prompt)
        nodes = workflow_dict.get("nodes", [])
        edges = workflow_dict.get("edges", [])
        normalised_edges = []
        for e in edges:
            normalised_edges.append(
                schemas.WorkflowEdge(
                    id=e.get("id"),
                    from_=e.get("from") or e.get("from_", ""),
                    to=e.get("to", ""),
                )
            )
        return schemas.GenerateWorkflowResponse(
            workflow=schemas.WorkflowDefinition(
                nodes=[schemas.WorkflowNode(**n) for n in nodes],
                edges=normalised_edges,
            )
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(exc)}")


# ── CRUD Workflows ─────────────────────────────────────────────────────────────

@router.post("/workflows", response_model=schemas.WorkflowResponse)
def create_workflow(
    request: schemas.CreateWorkflowRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    workflow = models.Workflow(
        user_id=user_id,
        name=request.name,
        description=request.description,
        json_definition=request.json_definition,
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


@router.get("/workflows", response_model=List[schemas.WorkflowResponse])
def list_workflows(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    return (
        db.query(models.Workflow)
        .filter(models.Workflow.user_id == user_id)
        .order_by(models.Workflow.created_at.desc())
        .all()
    )


@router.get("/workflows/{workflow_id}", response_model=schemas.WorkflowResponse)
def get_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    workflow = (
        db.query(models.Workflow)
        .filter(models.Workflow.id == workflow_id, models.Workflow.user_id == user_id)
        .first()
    )
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.put("/workflows/{workflow_id}", response_model=schemas.WorkflowResponse)
def update_workflow(
    workflow_id: str,
    request: schemas.UpdateWorkflowRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    workflow = (
        db.query(models.Workflow)
        .filter(models.Workflow.id == workflow_id, models.Workflow.user_id == user_id)
        .first()
    )
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if request.name is not None:
        workflow.name = request.name
    if request.description is not None:
        workflow.description = request.description
    if request.json_definition is not None:
        workflow.json_definition = request.json_definition
    workflow.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(workflow)
    return workflow


@router.delete("/workflows/{workflow_id}")
def delete_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    workflow = (
        db.query(models.Workflow)
        .filter(models.Workflow.id == workflow_id, models.Workflow.user_id == user_id)
        .first()
    )
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    db.delete(workflow)
    db.commit()
    return {"deleted": True, "id": workflow_id}


# ── Run Workflow ───────────────────────────────────────────────────────────────

@router.post("/run-workflow/{workflow_id}", response_model=schemas.WorkflowRunResponse)
def run(
    workflow_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Execute the workflow and persist the run result."""
    workflow = (
        db.query(models.Workflow)
        .filter(models.Workflow.id == workflow_id, models.Workflow.user_id == user_id)
        .first()
    )
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    run_record = models.WorkflowRun(
        workflow_id=workflow_id,
        status="running",
        logs=[],
    )
    db.add(run_record)
    db.commit()
    db.refresh(run_record)

    result = run_workflow(workflow.json_definition)

    run_record.status = result.get("status", "failed")
    run_record.logs = result.get("logs", [])
    db.commit()
    db.refresh(run_record)

    return run_record


@router.get("/workflows/{workflow_id}/runs", response_model=List[schemas.WorkflowRunResponse])
def list_runs(
    workflow_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """List all historical runs for a workflow (ownership-checked)."""
    # Verify ownership first
    workflow = (
        db.query(models.Workflow)
        .filter(models.Workflow.id == workflow_id, models.Workflow.user_id == user_id)
        .first()
    )
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    runs = (
        db.query(models.WorkflowRun)
        .filter(models.WorkflowRun.workflow_id == workflow_id)
        .order_by(models.WorkflowRun.created_at.desc())
        .all()
    )
    return runs
