"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
    Zap, Brain, Globe, MessageSquare, Mail, Database,
    GitBranch, Repeat, Clock, Settings2, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<
    string,
    { icon: React.ElementType; label: string; colorClass: string; handleColor: string }
> = {
    webhook: { icon: Zap, label: "Webhook", colorClass: "border-teal-500/40 bg-teal-500/10", handleColor: "#2dd4bf" },
    manual_trigger: { icon: Zap, label: "Manual Trigger", colorClass: "border-teal-500/40 bg-teal-500/10", handleColor: "#2dd4bf" },
    cron: { icon: Clock, label: "Cron", colorClass: "border-teal-500/40 bg-teal-500/10", handleColor: "#2dd4bf" },
    llm: { icon: Brain, label: "LLM", colorClass: "border-purple-500/40 bg-purple-500/10", handleColor: "#a78bfa" },
    ai_agent: { icon: Brain, label: "AI Agent", colorClass: "border-purple-500/40 bg-purple-500/10", handleColor: "#a78bfa" },
    http_request: { icon: Globe, label: "HTTP Request", colorClass: "border-orange-500/40 bg-orange-500/10", handleColor: "#fb923c" },
    slack: { icon: MessageSquare, label: "Slack", colorClass: "border-orange-500/40 bg-orange-500/10", handleColor: "#fb923c" },
    email: { icon: Mail, label: "Email", colorClass: "border-orange-500/40 bg-orange-500/10", handleColor: "#fb923c" },
    database_write: { icon: Database, label: "DB Write", colorClass: "border-orange-500/40 bg-orange-500/10", handleColor: "#fb923c" },
    condition: { icon: GitBranch, label: "Condition", colorClass: "border-yellow-500/40 bg-yellow-500/10", handleColor: "#eab308" },
    loop: { icon: Repeat, label: "Loop", colorClass: "border-yellow-500/40 bg-yellow-500/10", handleColor: "#eab308" },
};

const DEFAULT_CONFIG = {
    icon: Settings2,
    label: "Node",
    colorClass: "border-gray-500/40 bg-gray-500/10",
    handleColor: "#6b7280",
};

interface WorkflowNodeData {
    label: string;
    nodeType: string;
    params: Record<string, unknown>;
    onOpenConfig?: () => void;
}

function WorkflowNode({ data, selected }: NodeProps<WorkflowNodeData>) {
    const config = TYPE_CONFIG[data.nodeType] ?? DEFAULT_CONFIG;
    const Icon = config.icon;

    const paramCount = Object.keys(data.params ?? {}).filter(
        (k) => data.params[k] !== "" && data.params[k] != null
    ).length;

    return (
        <div
            className={cn(
                "min-w-[200px] max-w-[240px] rounded-xl border bg-surface-800 shadow-lg transition-all duration-150 cursor-pointer group",
                config.colorClass,
                selected ? "ring-2 ring-brand-500/60 ring-offset-1 ring-offset-surface-900" : ""
            )}
            onDoubleClick={data.onOpenConfig}
        >
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: config.handleColor, border: "2px solid #0a0b0f" }}
            />

            {/* Header */}
            <div className="px-3 py-3 flex items-center gap-2.5">
                <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: config.handleColor + "25" }}
                >
                    <Icon className="w-3.5 h-3.5" style={{ color: config.handleColor }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{data.label}</div>
                    <div className="text-[10px] text-gray-500 capitalize">{config.label}</div>
                </div>
                {/* Config indicator button */}
                <button
                    onClick={(e) => { e.stopPropagation(); data.onOpenConfig?.(); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all flex-shrink-0"
                    title="Configure node"
                >
                    <Settings className="w-3 h-3" />
                </button>
            </div>

            {/* Config summary */}
            <div className="px-3 pb-2.5">
                {paramCount > 0 ? (
                    <div className="text-[10px] text-gray-500 bg-surface-700/50 rounded-md px-2 py-1 truncate">
                        {Object.entries(data.params)
                            .filter(([, v]) => v !== "" && v != null)
                            .slice(0, 2)
                            .map(([k, v]) => `${k}: ${String(v).slice(0, 20)}`)
                            .join(" · ")}
                    </div>
                ) : (
                    <div
                        onClick={data.onOpenConfig}
                        className="text-[10px] text-brand-400/70 hover:text-brand-400 bg-brand-500/5 hover:bg-brand-500/10 border border-brand-500/20 rounded-md px-2 py-1 cursor-pointer transition-all text-center"
                    >
                        Click to configure →
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                style={{ background: config.handleColor, border: "2px solid #0a0b0f" }}
            />
        </div>
    );
}

export default memo(WorkflowNode);
