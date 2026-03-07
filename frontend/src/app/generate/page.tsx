"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import {
    Wand2,
    Loader2,
    Save,
    ChevronRight,
    Sparkles,
    Zap,
    Brain,
    Globe,
    MessageSquare,
    Clock,
    GitBranch,
} from "lucide-react";
import { apiGenerateWorkflow, apiCreateWorkflow, type WorkflowDefinition } from "@/lib/api";

const EXAMPLE_PROMPTS = [
    "Receive a webhook, summarize the message using AI, and send the result to Slack",
    "Every morning at 9am, fetch the latest news from an API and send an email summary",
    "When a form is submitted, validate the data with AI and write it to the database",
    "Create an AI agent that monitors HTTP endpoint health and sends alerts via email",
];

const NODE_TYPE_ICONS: Record<string, React.ReactNode> = {
    webhook: <Zap className="w-3.5 h-3.5" />,
    manual_trigger: <Zap className="w-3.5 h-3.5" />,
    cron: <Clock className="w-3.5 h-3.5" />,
    llm: <Brain className="w-3.5 h-3.5" />,
    ai_agent: <Brain className="w-3.5 h-3.5" />,
    http_request: <Globe className="w-3.5 h-3.5" />,
    slack: <MessageSquare className="w-3.5 h-3.5" />,
    email: <MessageSquare className="w-3.5 h-3.5" />,
    condition: <GitBranch className="w-3.5 h-3.5" />,
};

const NODE_TYPE_BADGE: Record<string, string> = {
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

export default function GeneratePage() {
    const router = useRouter();
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null);
    const [workflowName, setWorkflowName] = useState("AI Generated Workflow");

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        setWorkflow(null);
        try {
            const res = await apiGenerateWorkflow(prompt);
            setWorkflow(res.data.workflow);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { detail?: string } }; message?: string })
                ?.response?.data?.detail ?? "Failed to generate workflow. Check your API key.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!workflow) return;
        setSaving(true);
        try {
            const res = await apiCreateWorkflow({
                name: workflowName,
                description: prompt,
                json_definition: workflow as unknown as WorkflowDefinition,
            });
            router.push(`/editor/${res.data.id}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                {/* Header */}
                <div className="border-b border-white/[0.06] px-8 py-5">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <span>Dashboard</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-gray-300">AI Generator</span>
                    </div>
                    <h1 className="text-xl font-bold text-white">AI Workflow Generator</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Describe your automation in natural language and let AI build it for you
                    </p>
                </div>

                <div className="px-8 py-6 max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Input Panel */}
                        <div className="space-y-4">
                            <div className="glass-card p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-4 h-4 text-brand-400" />
                                    <span className="text-sm font-semibold text-white">Describe Your Workflow</span>
                                </div>
                                <textarea
                                    className="textarea-field h-36"
                                    placeholder="e.g. Receive a webhook, summarize the message using AI, and send the result to Slack..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
                                    }}
                                />
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-xs text-gray-600">Ctrl+Enter to generate</span>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={loading || !prompt.trim()}
                                        className="btn-primary"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Generating…
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 className="w-4 h-4" />
                                                Generate
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Example prompts */}
                            <div className="glass-card p-5">
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">
                                    Example Prompts
                                </p>
                                <div className="space-y-2">
                                    {EXAMPLE_PROMPTS.map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPrompt(p)}
                                            className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all"
                                        >
                                            &ldquo;{p}&rdquo;
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Preview Panel */}
                        <div>
                            {error && (
                                <div className="glass-card p-4 border-red-500/30 mb-4">
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}

                            {loading && (
                                <div className="glass-card p-8 flex flex-col items-center justify-center gap-3">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full border border-brand-500/30 animate-ping absolute inset-0" />
                                        <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center">
                                            <Brain className="w-5 h-5 text-brand-400" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-400">AI is generating your workflow…</p>
                                </div>
                            )}

                            {workflow && !loading && (
                                <div className="glass-card p-5 animate-slide-up space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-white">Generated Workflow</span>
                                        <span className="badge-success badge">
                                            {workflow.nodes?.length ?? 0} nodes
                                        </span>
                                    </div>

                                    {/* Nodes */}
                                    <div className="space-y-2">
                                        {(workflow.nodes as unknown as Array<{ id: string; type: string; name: string; params?: Record<string, string> }>)?.map((node, i) => (
                                            <div
                                                key={node.id}
                                                className="flex items-center gap-3 p-3 rounded-lg bg-surface-700/50 border border-white/[0.05]"
                                            >
                                                <div className="w-6 h-6 rounded-md bg-surface-600 flex items-center justify-center text-gray-400 flex-shrink-0">
                                                    {NODE_TYPE_ICONS[node.type] ?? <Zap className="w-3 h-3" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-white font-medium truncate">{node.name}</span>
                                                        <span className={NODE_TYPE_BADGE[node.type] ?? "badge bg-gray-500/15 text-gray-400 border border-gray-500/25"}>
                                                            {node.type}
                                                        </span>
                                                    </div>
                                                    {node.params && Object.keys(node.params).length > 0 && (
                                                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                                                            {Object.entries(node.params as Record<string, string>)
                                                                .slice(0, 2)
                                                                .map(([k, v]) => `${k}: ${v}`)
                                                                .join(" · ")}
                                                        </div>
                                                    )}
                                                </div>
                                                {i < (workflow.nodes?.length ?? 0) - 1 && (
                                                    <div className="w-5 h-5 rounded-full border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                                                        <ChevronRight className="w-3 h-3 text-brand-400" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Save */}
                                    <div className="pt-2 border-t border-white/[0.06] space-y-3">
                                        <input
                                            className="input-field"
                                            placeholder="Workflow name…"
                                            value={workflowName}
                                            onChange={(e) => setWorkflowName(e.target.value)}
                                        />
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="btn-primary w-full justify-center"
                                        >
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Save & Open Editor
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!workflow && !loading && !error && (
                                <div className="glass-card p-8 flex flex-col items-center justify-center gap-3 text-center h-full min-h-[300px]">
                                    <Wand2 className="w-8 h-8 text-gray-600" />
                                    <p className="text-sm text-gray-500">
                                        Your generated workflow will appear here
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
