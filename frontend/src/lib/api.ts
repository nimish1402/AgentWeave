import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
    headers: { "Content-Type": "application/json" },
});

// ── Auth interceptor ──────────────────────────────────────────────────────────
// AuthenticatedApiProvider calls setTokenGetter() synchronously during its
// render (NOT in useEffect) so the getter is always set before any child
// page mounts and fires an API call.
let _getToken: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
    _getToken = fn;
}

api.interceptors.request.use(async (config) => {
    if (_getToken) {
        try {
            const token = await _getToken();
            if (token) {
                config.headers["Authorization"] = `Bearer ${token}`;
            }
        } catch {
            // Not authenticated — backend will respond with 401
        }
    }
    return config;
});

export default api;

// ──── Types ────────────────────────────────────────────────────────────────────

export interface WorkflowNode {
    id: string;
    type: string;
    name: string;
    params: Record<string, unknown>;
    position?: { x: number; y: number };
}

export interface WorkflowEdge {
    id?: string;
    from: string;
    to: string;
}

export interface WorkflowDefinition {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
}

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    json_definition: WorkflowDefinition;
    created_at: string;
    updated_at: string;
}

export interface RunLog {
    timestamp: string;
    node_id: string;
    node_name: string;
    event: "start" | "success" | "error";
    data?: unknown;
}

export interface WorkflowRun {
    id: string;
    workflow_id: string;
    status: "pending" | "running" | "success" | "failed";
    logs: RunLog[];
    created_at: string;
}

// ──── API Functions ────────────────────────────────────────────────────────────

export const apiGenerateWorkflow = (prompt: string) =>
    api.post<{ workflow: WorkflowDefinition }>("/generate-workflow", { prompt });

export const apiCreateWorkflow = (data: {
    name: string;
    description?: string;
    json_definition: WorkflowDefinition;
}) => api.post<Workflow>("/workflows", data);

export const apiGetWorkflows = () => api.get<Workflow[]>("/workflows");

export const apiGetWorkflow = (id: string) => api.get<Workflow>(`/workflows/${id}`);

export const apiUpdateWorkflow = (
    id: string,
    data: Partial<{ name: string; description: string; json_definition: WorkflowDefinition }>
) => api.put<Workflow>(`/workflows/${id}`, data);

export const apiDeleteWorkflow = (id: string) => api.delete(`/workflows/${id}`);

export const apiRunWorkflow = (id: string) =>
    api.post<WorkflowRun>(`/run-workflow/${id}`);

export const apiGetWorkflowRuns = (id: string) =>
    api.get<WorkflowRun[]>(`/workflows/${id}/runs`);
