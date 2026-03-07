from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


# --- Workflow Node & Edge Schemas ---
class NodeParam(BaseModel):
    model_config = {"extra": "allow"}


class WorkflowNode(BaseModel):
    id: str
    type: str
    name: str
    params: Dict[str, Any] = {}
    position: Optional[Dict[str, float]] = None


class WorkflowEdge(BaseModel):
    id: Optional[str] = None
    from_: str  # 'from' is a Python keyword
    to: str

    model_config = {"populate_by_name": True}

    @classmethod
    def model_validate(cls, obj, **kwargs):
        if isinstance(obj, dict):
            if "from" in obj and "from_" not in obj:
                obj = {**obj, "from_": obj.pop("from")}
        return super().model_validate(obj, **kwargs)


class WorkflowDefinition(BaseModel):
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]


# --- Request / Response Schemas ---
class GenerateWorkflowRequest(BaseModel):
    prompt: str


class GenerateWorkflowResponse(BaseModel):
    workflow: WorkflowDefinition


class CreateWorkflowRequest(BaseModel):
    name: str
    description: Optional[str] = None
    json_definition: Dict[str, Any]


class UpdateWorkflowRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    json_definition: Optional[Dict[str, Any]] = None


class WorkflowResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    json_definition: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkflowRunResponse(BaseModel):
    id: str
    workflow_id: str
    status: str
    logs: List[Dict[str, Any]]
    created_at: datetime

    model_config = {"from_attributes": True}
