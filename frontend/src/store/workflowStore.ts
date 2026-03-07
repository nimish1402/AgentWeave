import { create } from "zustand";
import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from "@/lib/api";
import { Node, Edge } from "reactflow";

// ──── Helper: convert API workflow → React Flow nodes/edges ──────────────────

export function toReactFlowNodes(nodes: WorkflowNode[]): Node[] {
    return nodes.map((n) => ({
        id: n.id,
        type: "workflowNode",
        position: n.position ?? { x: 0, y: 0 },
        data: {
            label: n.name,
            nodeType: n.type,
            params: n.params,
        },
    }));
}

export function toReactFlowEdges(edges: WorkflowEdge[]): Edge[] {
    return edges.map((e, i) => ({
        id: e.id ?? `e-${e.from}-${e.to}-${i}`,
        source: e.from,
        target: e.to,
        animated: true,
    }));
}

export function fromReactFlowNodes(rfNodes: Node[]): WorkflowNode[] {
    return rfNodes.map((n) => ({
        id: n.id,
        type: n.data.nodeType,
        name: n.data.label,
        params: n.data.params ?? {},
        position: n.position,
    }));
}

export function fromReactFlowEdges(rfEdges: Edge[]): WorkflowEdge[] {
    return rfEdges.map((e) => ({
        id: e.id,
        from: e.source,
        to: e.target,
    }));
}

// ──── Zustand Store ──────────────────────────────────────────────────────────

interface WorkflowStore {
    // Current workflow being edited
    currentWorkflowId: string | null;
    currentWorkflowName: string;
    rfNodes: Node[];
    rfEdges: Edge[];

    setWorkflow: (id: string | null, name: string, def: WorkflowDefinition) => void;
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    updateNodeData: (nodeId: string, data: Partial<Node["data"]>) => void;
    clearWorkflow: () => void;

    // Run state
    isRunning: boolean;
    runLogs: unknown[];
    runStatus: "idle" | "running" | "success" | "failed";
    setRunState: (state: Partial<Pick<WorkflowStore, "isRunning" | "runLogs" | "runStatus">>) => void;
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
    currentWorkflowId: null,
    currentWorkflowName: "Untitled Workflow",
    rfNodes: [],
    rfEdges: [],

    setWorkflow: (id, name, def) =>
        set({
            currentWorkflowId: id,
            currentWorkflowName: name,
            rfNodes: toReactFlowNodes(def.nodes),
            rfEdges: toReactFlowEdges(def.edges),
        }),

    setNodes: (nodes) => set({ rfNodes: nodes }),
    setEdges: (edges) => set({ rfEdges: edges }),

    updateNodeData: (nodeId, data) =>
        set((state) => ({
            rfNodes: state.rfNodes.map((n) =>
                n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
            ),
        })),

    clearWorkflow: () =>
        set({
            currentWorkflowId: null,
            currentWorkflowName: "Untitled Workflow",
            rfNodes: [],
            rfEdges: [],
            runLogs: [],
            runStatus: "idle",
        }),

    // Run state
    isRunning: false,
    runLogs: [],
    runStatus: "idle",
    setRunState: (state) => set(state),
}));
