"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    BackgroundVariant,
    addEdge,
    Connection,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
} from "reactflow";
import "reactflow/dist/style.css";

import Sidebar from "@/components/layout/Sidebar";
import WorkflowNodeComponent from "@/components/workflow/WorkflowNode";
import NodeConfigDialog from "@/components/workflow/NodeConfigDialog";
import {
    apiGetWorkflow,
    apiUpdateWorkflow,
    apiRunWorkflow,
    apiGetWorkflowRuns,
    type WorkflowRun,
    type RunLog,
} from "@/lib/api";
import {
    toReactFlowNodes,
    toReactFlowEdges,
    fromReactFlowNodes,
    fromReactFlowEdges,
} from "@/store/workflowStore";
import {
    Save, Play, Loader2, ChevronRight, CheckCircle, XCircle,
    AlertCircle, Plus, Zap, Brain, Globe, MessageSquare,
    Mail, Database, GitBranch, Repeat, Clock, ChevronDown,
    ChevronUp, ArrowLeft, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Node type registry ────────────────────────────────────────────────────────
const nodeTypes = { workflowNode: WorkflowNodeComponent };

const SIDEBAR_NODES = [
    { type: "webhook", label: "Webhook Trigger", icon: Zap, category: "trigger" },
    { type: "manual_trigger", label: "Manual Trigger", icon: Zap, category: "trigger" },
    { type: "cron", label: "Cron Trigger", icon: Clock, category: "trigger" },
    { type: "llm", label: "LLM Call", icon: Brain, category: "ai" },
    { type: "ai_agent", label: "AI Agent", icon: Brain, category: "ai" },
    { type: "http_request", label: "HTTP Request", icon: Globe, category: "action" },
    { type: "slack", label: "Slack Message", icon: MessageSquare, category: "action" },
    { type: "email", label: "Send Email", icon: Mail, category: "action" },
    { type: "database_write", label: "DB Write", icon: Database, category: "action" },
    { type: "condition", label: "Condition", icon: GitBranch, category: "logic" },
    { type: "loop", label: "Loop", icon: Repeat, category: "logic" },
];

const CAT_COLORS: Record<string, string> = {
    trigger: "text-teal-400",
    ai: "text-purple-400",
    action: "text-orange-400",
    logic: "text-yellow-400",
};

// ─── Run Logs Panel ────────────────────────────────────────────────────────────
function RunLogsPanel({ run }: { run: WorkflowRun | null }) {
    if (!run) return null;
    return (
        <div className="border-t border-white/[0.06] p-4 space-y-2 overflow-y-auto max-h-64">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white">Execution Logs</span>
                <span className={cn("badge", {
                    "badge-success": run.status === "success",
                    "badge-error": run.status === "failed",
                    "badge-running": run.status === "running",
                })}>
                    {run.status}
                </span>
            </div>
            {run.logs.map((log: RunLog, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-surface-700/50 border border-white/[0.04] text-xs">
                    {log.event === "success" ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : log.event === "error" ? (
                        <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                        <span className="font-medium text-gray-300">{log.node_name}</span>
                        <span className="text-gray-500 ml-1.5">{log.event}</span>
                        {log.data != null && (
                            <pre className="mt-1 text-[10px] text-gray-500 whitespace-pre-wrap break-all">
                                {JSON.stringify(log.data as Record<string, unknown>, null, 2).slice(0, 300)}
                            </pre>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Main Editor Component ─────────────────────────────────────────────────────
export default function EditorPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { isLoaded, isSignedIn } = useAuth();

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const [workflowName, setWorkflowName] = useState("Workflow");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [running, setRunning] = useState(false);
    const [latestRun, setLatestRun] = useState<WorkflowRun | null>(null);
    const [showRuns, setShowRuns] = useState(false);
    const [nodesPanelOpen, setNodesPanelOpen] = useState(true);

    // Dialog state
    const [dialogNode, setDialogNode] = useState<Node | null>(null);

    // ── Helpers ──────────────────────────────────────────────────────────────────

    const openConfig = useCallback((node: Node) => {
        setDialogNode(node);
    }, []);

    /** Build node data with the onOpenConfig callback injected. */
    const withCallback = useCallback(
        (rawNodes: Node[]): Node[] =>
            rawNodes.map((n) => ({
                ...n,
                data: {
                    ...n.data,
                    onOpenConfig: () => openConfig(n),
                },
            })),
        [openConfig]
    );

    // Load workflow — wait for Clerk session to be ready
    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;
        const load = async () => {
            try {
                const res = await apiGetWorkflow(id);
                setWorkflowName(res.data.name);
                const def = res.data.json_definition;
                const rfNodes = withCallback(toReactFlowNodes(def.nodes));
                setNodes(rfNodes);
                setEdges(toReactFlowEdges(def.edges));
                const runRes = await apiGetWorkflowRuns(id);
                if (runRes.data.length > 0) setLatestRun(runRes.data[0]);
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isLoaded, isSignedIn]);

    // Keep callback fresh after every nodes update
    useEffect(() => {
        setNodes((nds) => withCallback(nds));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onConnect = useCallback(
        (params: Connection) =>
            setEdges((eds: Edge[]) => addEdge({ ...params, animated: true }, eds)),
        [setEdges]
    );

    const handleSave = async () => {
        setSaving(true);
        try {
            const wfNodes = fromReactFlowNodes(nodes);
            const wfEdges = fromReactFlowEdges(edges);
            await apiUpdateWorkflow(id, { name: workflowName, json_definition: { nodes: wfNodes, edges: wfEdges } });
        } finally {
            setSaving(false);
        }
    };

    const handleRun = async () => {
        setRunning(true);
        setShowRuns(true);
        try {
            const res = await apiRunWorkflow(id);
            setLatestRun(res.data);
        } finally {
            setRunning(false);
        }
    };

    // Add node from sidebar palette
    const handleAddNode = (type: string, label: string, position?: { x: number; y: number }) => {
        const newNode: Node = {
            id: `node-${Date.now()}`,
            type: "workflowNode",
            position: position ?? { x: Math.random() * 400 + 100, y: Math.random() * 200 + 100 },
            data: { label, nodeType: type, params: {} },
        };
        const withCb: Node = { ...newNode, data: { ...newNode.data, onOpenConfig: () => openConfig(withCb) } };
        setNodes((nds: Node[]) => [...nds, withCb]);
    };

    // ── Dialog save handler ───────────────────────────────────────────────────────
    const handleDialogSave = useCallback(
        (nodeId: string, name: string, params: Record<string, unknown>) => {
            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id !== nodeId) return n;
                    const updated = { ...n, data: { ...n.data, label: name, params } };
                    return { ...updated, data: { ...updated.data, onOpenConfig: () => openConfig(updated) } };
                })
            );
            setDialogNode(null);
        },
        [openConfig, setNodes]
    );

    // ── Delete node handler ───────────────────────────────────────────────────────
    const handleDeleteNode = useCallback(
        (nodeId: string) => {
            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
            setDialogNode(null);
        },
        [setEdges, setNodes]
    );

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-surface-900">
                <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <div className="flex-shrink-0 border-b border-white/[0.06] bg-surface-800 px-4 py-3 flex items-center gap-3">
                    <button onClick={() => router.push("/dashboard")} className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-3 h-3 text-gray-600" />
                    <input
                        className="bg-transparent text-white font-semibold text-sm focus:outline-none border-b border-transparent focus:border-brand-500/60 transition-all px-1 py-0.5"
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                    />
                    <div className="flex-1" />

                    {/* Selected node delete shortcut hint */}
                    <span className="text-[10px] text-gray-600 hidden lg:block">
                        Double-click node to configure · Del to delete selected
                    </span>

                    <button onClick={handleSave} disabled={saving} className="btn-secondary text-xs px-3 py-1.5">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                    </button>
                    <button onClick={handleRun} disabled={running} className="btn-primary text-xs px-3 py-1.5">
                        {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        Run Workflow
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left sidebar – node palette */}
                    <div className="w-52 flex-shrink-0 border-r border-white/[0.06] bg-surface-800 flex flex-col overflow-hidden">
                        <button
                            onClick={() => setNodesPanelOpen((v) => !v)}
                            className="px-3 py-2.5 flex items-center justify-between text-xs font-semibold text-gray-400 hover:text-gray-200 border-b border-white/[0.06] transition-colors"
                        >
                            <span>Node Library</span>
                            {nodesPanelOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {nodesPanelOpen && (
                            <div className="overflow-y-auto flex-1 p-2">
                                {Object.entries(
                                    SIDEBAR_NODES.reduce<Record<string, typeof SIDEBAR_NODES>>((acc, n) => {
                                        (acc[n.category] = acc[n.category] ?? []).push(n);
                                        return acc;
                                    }, {})
                                ).map(([cat, catNodes]) => (
                                    <div key={cat} className="mb-2">
                                        <div className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1", CAT_COLORS[cat])}>
                                            {cat}
                                        </div>
                                        {catNodes.map(({ type, label, icon: Icon }) => (
                                            <button
                                                key={type}
                                                onClick={() => handleAddNode(type, label)}
                                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-gray-400 hover:text-gray-200 hover:bg-white/[0.05] transition-all"
                                            >
                                                <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", CAT_COLORS[cat])} />
                                                <span className="truncate">{label}</span>
                                                <Plus className="w-3 h-3 ml-auto opacity-50" />
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Delete selected node button */}
                        <div className="border-t border-white/[0.06] p-2">
                            <button
                                onClick={() => {
                                    const selected = nodes.find((n) => n.selected);
                                    if (selected) handleDeleteNode(selected.id);
                                }}
                                className="w-full btn-danger text-xs py-1.5 justify-center"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Selected
                            </button>
                        </div>
                    </div>

                    {/* React Flow Canvas */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1">
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                nodeTypes={nodeTypes}
                                onNodeDoubleClick={(_, node) => openConfig(node)}
                                fitView
                                fitViewOptions={{ padding: 0.2 }}
                                defaultEdgeOptions={{ animated: true, style: { stroke: "#4f6ef7", strokeWidth: 2 } }}
                                deleteKeyCode={["Backspace", "Delete"]}
                            >
                                <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#222535" />
                                <Controls />
                                <MiniMap
                                    nodeColor={(n) => {
                                        const type = n.data?.nodeType as string;
                                        const colors: Record<string, string> = {
                                            webhook: "#2dd4bf", manual_trigger: "#2dd4bf", cron: "#2dd4bf",
                                            llm: "#a78bfa", ai_agent: "#a78bfa",
                                            http_request: "#fb923c", slack: "#fb923c", email: "#fb923c", database_write: "#fb923c",
                                            condition: "#eab308", loop: "#eab308",
                                        };
                                        return colors[type] ?? "#6b7280";
                                    }}
                                />
                            </ReactFlow>
                        </div>

                        {/* Run logs panel */}
                        {showRuns && (
                            <div className="border-t border-white/[0.06] bg-surface-800">
                                <button onClick={() => setShowRuns(false)} className="w-full px-4 py-2 flex items-center justify-between text-xs text-gray-500 hover:text-gray-300 transition-colors">
                                    <span className="font-medium">Execution Panel</span>
                                    <ChevronDown className="w-3 h-3" />
                                </button>
                                <RunLogsPanel run={latestRun} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Node Config Dialog */}
            {dialogNode && (
                <NodeConfigDialog
                    nodeId={dialogNode.id}
                    nodeType={dialogNode.data.nodeType}
                    nodeName={dialogNode.data.label}
                    params={dialogNode.data.params ?? {}}
                    onSave={handleDialogSave}
                    onDelete={handleDeleteNode}
                    onClose={() => setDialogNode(null)}
                />
            )}
        </div>
    );
}
