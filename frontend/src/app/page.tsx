"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import Sidebar from "@/components/layout/Sidebar";
import {
    Plus,
    Trash2,
    Pencil,
    Play,
    Zap,
    ChevronRight,
    Workflow as WorkflowIcon,
    Clock,
} from "lucide-react";
import {
    apiGetWorkflows,
    apiDeleteWorkflow,
    apiCreateWorkflow,
    type Workflow as WorkflowData,
} from "@/lib/api";

function NodeTypeBadge({ type }: { type: string }) {
    const map: Record<string, string> = {
        webhook: "badge-trigger",
        manual_trigger: "badge-trigger",
        cron: "badge-trigger",
        llm: "badge-llm",
        ai_agent: "badge-llm",
        http_request: "badge-action",
        slack: "badge-action",
        email: "badge-action",
        database_write: "badge-action",
        condition: "badge-logic",
        loop: "badge-logic",
    };
    return (
        <span className={map[type] ?? "badge bg-gray-500/15 text-gray-400 border border-gray-500/25"}>
            {type.replace("_", " ")}
        </span>
    );
}

function WorkflowCard({ workflow, onDelete }: { workflow: WorkflowData; onDelete: () => void }) {
    const router = useRouter();
    const nodeCount = workflow.json_definition?.nodes?.length ?? 0;

    return (
        <div className="glass-card p-5 group hover:border-brand-500/30 transition-all duration-200 hover:shadow-glow-sm">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
                        <WorkflowIcon className="w-4 h-4 text-brand-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-sm leading-tight">{workflow.name}</h3>
                        {workflow.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{workflow.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => router.push(`/editor/${workflow.id}`)}
                        className="p-1.5 rounded-md text-gray-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
                        title="Edit"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Nodes preview */}
            <div className="flex flex-wrap gap-1.5 mb-4">
                {(workflow.json_definition?.nodes ?? []).slice(0, 4).map((n) => (
                    <NodeTypeBadge key={n.id} type={n.type} />
                ))}
                {nodeCount > 4 && (
                    <span className="badge bg-surface-600 text-gray-400 border border-white/10">
                        +{nodeCount - 4} more
                    </span>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(workflow.updated_at).toLocaleDateString()}
                </div>
                <Link
                    href={`/editor/${workflow.id}`}
                    className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
                >
                    Open Editor
                    <ChevronRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const router = useRouter();
    const { isLoaded, isSignedIn } = useAuth();
    const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    const fetchWorkflows = async () => {
        try {
            const res = await apiGetWorkflows();
            setWorkflows(res.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Wait for Clerk to finish loading the session before making auth'd requests
        if (!isLoaded || !isSignedIn) return;
        fetchWorkflows();
    }, [isLoaded, isSignedIn]);

    const handleDelete = async (id: string) => {
        await apiDeleteWorkflow(id);
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
    };

    const handleCreateBlank = async () => {
        setCreating(true);
        try {
            const res = await apiCreateWorkflow({
                name: "New Workflow",
                json_definition: { nodes: [], edges: [] },
            });
            router.push(`/editor/${res.data.id}`);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                {/* Header */}
                <div className="border-b border-white/[0.06] px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-white">Dashboard</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {workflows.length} workflow{workflows.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => router.push("/generate")} className="btn-secondary">
                                <Zap className="w-4 h-4" />
                                AI Generate
                            </button>
                            <button onClick={handleCreateBlank} disabled={creating} className="btn-primary">
                                <Plus className="w-4 h-4" />
                                Blank Workflow
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="glass-card p-5 animate-pulse h-36" />
                            ))}
                        </div>
                    ) : workflows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                                <Zap className="w-7 h-7 text-brand-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white mb-2">No workflows yet</h2>
                            <p className="text-sm text-gray-500 mb-6 max-w-xs">
                                Create your first automation workflow with AI or start from a blank canvas.
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => router.push("/generate")} className="btn-primary">
                                    <Zap className="w-4 h-4" />
                                    Generate with AI
                                </button>
                                <button onClick={handleCreateBlank} className="btn-secondary">
                                    <Plus className="w-4 h-4" />
                                    Blank Workflow
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                            {workflows.map((w) => (
                                <WorkflowCard
                                    key={w.id}
                                    workflow={w}
                                    onDelete={() => handleDelete(w.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
