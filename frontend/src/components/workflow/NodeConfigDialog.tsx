"use client";

import { useState, useEffect } from "react";
import { X, Save, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Per-node-type field definitions ─────────────────────────────────────────

interface FieldDef {
    key: string;
    label: string;
    type: "text" | "textarea" | "select" | "url";
    placeholder?: string;
    options?: string[];
}

const NODE_FIELDS: Record<string, FieldDef[]> = {
    webhook: [
        { key: "url", label: "Webhook URL", type: "url", placeholder: "https://your-server.com/webhook" },
        { key: "method", label: "HTTP Method", type: "select", options: ["POST", "GET", "PUT", "PATCH"] },
    ],
    manual_trigger: [],
    cron: [
        { key: "schedule", label: "Cron Schedule", type: "text", placeholder: "0 9 * * * (every day at 9am)" },
    ],
    llm: [
        { key: "model", label: "Model", type: "select", options: ["llama-3.3-70b-versatile", "llama3-8b-8192", "mixtral-8x7b-32768", "gemma2-9b-it"] },
        { key: "prompt", label: "System Prompt / Instruction", type: "textarea", placeholder: "Summarize the following text: {{input}}" },
        { key: "input_key", label: "Input Context Key", type: "text", placeholder: "text" },
    ],
    ai_agent: [
        { key: "model", label: "Model", type: "select", options: ["llama-3.3-70b-versatile", "llama3-8b-8192", "mixtral-8x7b-32768"] },
        { key: "system_prompt", label: "Agent System Prompt", type: "textarea", placeholder: "You are a helpful assistant that..." },
    ],
    http_request: [
        { key: "url", label: "URL", type: "url", placeholder: "https://api.example.com/data" },
        { key: "method", label: "Method", type: "select", options: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
        { key: "body", label: "Request Body (JSON)", type: "textarea", placeholder: '{"key": "value"}' },
    ],
    slack: [
        { key: "channel", label: "Channel", type: "text", placeholder: "#general" },
        { key: "message_template", label: "Message Template", type: "textarea", placeholder: "Result: {{input}}" },
    ],
    email: [
        { key: "to", label: "Recipient Email", type: "text", placeholder: "user@example.com" },
        { key: "subject", label: "Subject", type: "text", placeholder: "Workflow Result" },
        { key: "body_template", label: "Body Template", type: "textarea", placeholder: "Hello,\n\n{{input}}" },
    ],
    database_write: [
        { key: "table", label: "Table Name", type: "text", placeholder: "results" },
        { key: "data_key", label: "Data Context Key", type: "text", placeholder: "result" },
    ],
    condition: [
        { key: "field", label: "Field (context key)", type: "text", placeholder: "status" },
        { key: "operator", label: "Operator", type: "select", options: ["equals", "not_equals", "contains", "greater_than", "less_than"] },
        { key: "value", label: "Compare Value", type: "text", placeholder: "success" },
    ],
    loop: [
        { key: "items_key", label: "Items Context Key", type: "text", placeholder: "results" },
        { key: "max_iterations", label: "Max Iterations", type: "text", placeholder: "10" },
    ],
};

// ─── Component ────────────────────────────────────────────────────────────────

interface NodeConfigDialogProps {
    nodeId: string;
    nodeType: string;
    nodeName: string;
    params: Record<string, unknown>;
    onSave: (nodeId: string, name: string, params: Record<string, unknown>) => void;
    onDelete: (nodeId: string) => void;
    onClose: () => void;
}

export default function NodeConfigDialog({
    nodeId,
    nodeType,
    nodeName,
    params,
    onSave,
    onDelete,
    onClose,
}: NodeConfigDialogProps) {
    const [name, setName] = useState(nodeName);
    const [values, setValues] = useState<Record<string, string>>(() => {
        const out: Record<string, string> = {};
        (NODE_FIELDS[nodeType] ?? []).forEach((f) => {
            out[f.key] = String(params[f.key] ?? "");
        });
        return out;
    });
    const [confirmDelete, setConfirmDelete] = useState(false);

    const fields = NODE_FIELDS[nodeType] ?? [];

    const handleSave = () => {
        const newParams: Record<string, unknown> = {};
        fields.forEach((f) => {
            if (values[f.key] !== "") newParams[f.key] = values[f.key];
        });
        onSave(nodeId, name, newParams);
        onClose();
    };

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const TYPE_LABEL: Record<string, string> = {
        webhook: "Webhook Trigger", manual_trigger: "Manual Trigger", cron: "Cron Trigger",
        llm: "LLM Call", ai_agent: "AI Agent", http_request: "HTTP Request",
        slack: "Slack Message", email: "Send Email", database_write: "Database Write",
        condition: "Condition", loop: "Loop",
    };

    const TYPE_COLOR: Record<string, string> = {
        webhook: "text-teal-400 bg-teal-500/10 border-teal-500/30",
        manual_trigger: "text-teal-400 bg-teal-500/10 border-teal-500/30",
        cron: "text-teal-400 bg-teal-500/10 border-teal-500/30",
        llm: "text-purple-400 bg-purple-500/10 border-purple-500/30",
        ai_agent: "text-purple-400 bg-purple-500/10 border-purple-500/30",
        http_request: "text-orange-400 bg-orange-500/10 border-orange-500/30",
        slack: "text-orange-400 bg-orange-500/10 border-orange-500/30",
        email: "text-orange-400 bg-orange-500/10 border-orange-500/30",
        database_write: "text-orange-400 bg-orange-500/10 border-orange-500/30",
        condition: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
        loop: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-slide-up">
                <div className="glass-card border-white/10 shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                        <div className="flex items-center gap-3">
                            <span className={cn("badge border", TYPE_COLOR[nodeType] ?? "text-gray-400 bg-gray-500/10 border-gray-500/30")}>
                                {TYPE_LABEL[nodeType] ?? nodeType}
                            </span>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] transition-all">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        {/* Node name */}
                        <div>
                            <label className="text-xs text-gray-500 font-medium mb-1.5 block">Node Name</label>
                            <input
                                className="input-field"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Node name..."
                            />
                        </div>

                        {/* Type-specific fields */}
                        {fields.length === 0 ? (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-700/50 border border-white/[0.05] text-sm text-gray-500">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                This node has no configurable parameters.
                            </div>
                        ) : (
                            fields.map((field) => (
                                <div key={field.key}>
                                    <label className="text-xs text-gray-500 font-medium mb-1.5 block">
                                        {field.label}
                                    </label>
                                    {field.type === "select" ? (
                                        <select
                                            className="input-field bg-surface-700"
                                            value={values[field.key] ?? ""}
                                            onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                                        >
                                            <option value="">Select…</option>
                                            {field.options?.map((o) => (
                                                <option key={o} value={o}>{o}</option>
                                            ))}
                                        </select>
                                    ) : field.type === "textarea" ? (
                                        <textarea
                                            className="textarea-field h-24"
                                            value={values[field.key] ?? ""}
                                            onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                                            placeholder={field.placeholder}
                                        />
                                    ) : (
                                        <input
                                            className="input-field"
                                            type={field.type === "url" ? "url" : "text"}
                                            value={values[field.key] ?? ""}
                                            onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                                            placeholder={field.placeholder}
                                        />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-4 border-t border-white/[0.06] flex items-center justify-between">
                        {confirmDelete ? (
                            <div className="flex items-center gap-2 flex-1">
                                <span className="text-xs text-red-400">Remove this node?</span>
                                <button
                                    onClick={() => { onDelete(nodeId); onClose(); }}
                                    className="btn-danger text-xs px-3 py-1.5"
                                >Yes, remove</button>
                                <button onClick={() => setConfirmDelete(false)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => setConfirmDelete(true)}
                                    className="btn-danger text-xs px-3 py-1.5"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Remove Node
                                </button>
                                <button onClick={handleSave} className="btn-primary text-xs px-4 py-1.5">
                                    <Save className="w-3.5 h-3.5" />
                                    Save Changes
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
