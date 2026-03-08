"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
    Zap, Brain, Globe, Mail, GitBranch, Repeat,
    ArrowRight, CheckCircle, Play, Sparkles,
    Workflow, Shield, ChevronRight
} from "lucide-react";

const FEATURES = [
    {
        icon: Brain,
        color: "text-purple-400",
        bg: "bg-purple-500/10 border-purple-500/20",
        title: "AI Workflow Generation",
        desc: "Describe your automation in plain English. Our AI builds the entire workflow for you in seconds.",
    },
    {
        icon: Workflow,
        color: "text-brand-400",
        bg: "bg-brand-500/10 border-brand-500/20",
        title: "Visual Node Editor",
        desc: "Drag, drop, and connect nodes on a beautiful canvas. No code required.",
    },
    {
        icon: Globe,
        color: "text-orange-400",
        bg: "bg-orange-500/10 border-orange-500/20",
        title: "20+ Integrations",
        desc: "HTTP requests, Email, Slack, databases, webhooks, cron jobs and more — all built in.",
    },
    {
        icon: Shield,
        color: "text-teal-400",
        bg: "bg-teal-500/10 border-teal-500/20",
        title: "Per-User Isolation",
        desc: "Your workflows are private. Secure auth with real-time execution logs per run.",
    },
];

const NODE_PALETTE = [
    { type: "Webhook Trigger", color: "bg-teal-500/20 border-teal-500/40 text-teal-300", icon: Zap },
    { type: "LLM Call", color: "bg-purple-500/20 border-purple-500/40 text-purple-300", icon: Brain },
    { type: "HTTP Request", color: "bg-orange-500/20 border-orange-500/40 text-orange-300", icon: Globe },
    { type: "Send Email", color: "bg-orange-500/20 border-orange-500/40 text-orange-300", icon: Mail },
    { type: "Condition", color: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300", icon: GitBranch },
    { type: "Loop", color: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300", icon: Repeat },
];

const WORKFLOW_NODES = [
    { x: 40, label: "Webhook Trigger", color: "teal", icon: Zap },
    { x: 220, label: "Summarize with AI", color: "purple", icon: Brain },
    { x: 400, label: "Send to Slack", color: "orange", icon: Mail },
];

function FloatingWorkflow() {
    return (
        <div className="relative w-full h-52 select-none pointer-events-none">
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <marker id="arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L6,3 L0,6 Z" fill="#4f6ef7" opacity="0.7" />
                    </marker>
                </defs>
                <line x1="150" y1="100" x2="218" y2="100" stroke="#4f6ef7" strokeWidth="2" strokeDasharray="4 2" opacity="0.6" markerEnd="url(#arrow)" />
                <line x1="330" y1="100" x2="398" y2="100" stroke="#4f6ef7" strokeWidth="2" strokeDasharray="4 2" opacity="0.6" markerEnd="url(#arrow)" />
            </svg>
            {/* Nodes */}
            {WORKFLOW_NODES.map((node, i) => {
                const Icon = node.icon;
                const colors: Record<string, string> = {
                    teal: "border-teal-500/50 bg-teal-500/10",
                    purple: "border-purple-500/50 bg-purple-500/10",
                    orange: "border-orange-500/50 bg-orange-500/10",
                };
                const iconColors: Record<string, string> = {
                    teal: "text-teal-400", purple: "text-purple-400", orange: "text-orange-400",
                };
                return (
                    <div
                        key={i}
                        className={`absolute top-1/2 -translate-y-1/2 w-[130px] rounded-xl border ${colors[node.color]} p-3 backdrop-blur-sm`}
                        style={{ left: `${node.x}px` }}
                    >
                        <div className="flex items-center gap-2 mb-1.5">
                            <Icon className={`w-3.5 h-3.5 ${iconColors[node.color]}`} />
                            <span className="text-[10px] font-semibold text-white truncate">{node.label}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/5">
                            <div className={`h-full rounded-full ${node.color === "teal" ? "bg-teal-500/60 w-full" : node.color === "purple" ? "bg-purple-500/60 w-3/4 animate-pulse" : "bg-orange-500/40 w-1/2"}`} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function LandingPage() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();
    const [typed, setTyped] = useState("");
    const TAGLINE = "Automate anything with AI.";

    // Redirect already-signed-in users directly to dashboard
    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.prefetch("/dashboard");
        }
    }, [isLoaded, isSignedIn, router]);

    // Typewriter effect
    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            setTyped(TAGLINE.slice(0, i + 1));
            i++;
            if (i === TAGLINE.length) clearInterval(timer);
        }, 55);
        return () => clearInterval(timer);
    }, []);

    const handleCTA = () => {
        if (isLoaded && isSignedIn) {
            router.push("/dashboard");
        } else {
            router.push("/sign-in");
        }
    };

    return (
        <div className="min-h-screen bg-surface-900 overflow-x-hidden">

            {/* ── Nav ──────────────────────────────────────────────────────── */}
            <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.05] bg-surface-900/80 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-glow-sm">
                            <Zap className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-bold text-base text-white tracking-tight">
                            Agent<span className="text-brand-400">Weave</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {isLoaded && isSignedIn ? (
                            <Link href="/dashboard" className="btn-primary text-xs px-4 py-1.5">
                                Dashboard <ArrowRight className="w-3 h-3" />
                            </Link>
                        ) : (
                            <>
                                <Link href="/sign-in" className="text-sm text-gray-400 hover:text-white transition-colors">Sign In</Link>
                                <Link href="/sign-up" className="btn-primary text-xs px-4 py-1.5">
                                    Get Started <ArrowRight className="w-3 h-3" />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <section className="relative pt-36 pb-20 px-6">
                {/* Background glow orbs */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-32 left-1/3 w-[300px] h-[200px] bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

                <div className="relative max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-400 text-xs font-medium mb-6">
                        <Sparkles className="w-3 h-3" />
                        AI-Powered Workflow Automation
                    </div>

                    <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-[1.12] tracking-tight mb-4">
                        Build workflows that<br />
                        <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                            {typed}
                            <span className="animate-pulse">|</span>
                        </span>
                    </h1>

                    <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        AgentWeave lets you visually build, connect, and run AI-powered automation workflows —
                        no code required. Describe what you need, and our AI builds it for you.
                    </p>

                    {/* CTA buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                            onClick={handleCTA}
                            className="btn-primary px-7 py-3 text-sm font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-[1.02] transition-all"
                        >
                            <Play className="w-4 h-4" />
                            {isLoaded && isSignedIn ? "Go to Dashboard" : "Start Building Free"}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <Link
                            href="/sign-in"
                            className="btn-secondary px-7 py-3 text-sm"
                        >
                            View Demo Workflow
                        </Link>
                    </div>

                    <p className="text-xs text-gray-600 mt-4">Free to use · No credit card required</p>
                </div>

                {/* Floating workflow preview */}
                <div className="relative max-w-3xl mx-auto mt-16">
                    <div className="glass-card p-6 shadow-2xl shadow-black/40 overflow-hidden">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                            <span className="text-xs text-gray-600 ml-2">AgentWeave Editor</span>
                        </div>
                        <div className="bg-surface-900 rounded-lg border border-white/[0.04] overflow-hidden">
                            <FloatingWorkflow />
                        </div>
                        {/* Run log simulation */}
                        <div className="mt-4 space-y-1.5">
                            {[
                                { color: "text-teal-400", label: "Webhook Trigger", msg: "Triggered successfully", time: "0ms" },
                                { color: "text-purple-400", label: "Summarize with AI", msg: "Generated 248 char summary", time: "1.2s" },
                                { color: "text-green-400", label: "Send to Slack", msg: "Message delivered to #general", time: "1.5s" },
                            ].map((log, i) => (
                                <div key={i} className="flex items-center gap-2 text-[11px]">
                                    <CheckCircle className={`w-3 h-3 ${log.color} flex-shrink-0`} />
                                    <span className="text-gray-500">{log.time}</span>
                                    <span className="font-medium text-gray-300">{log.label}</span>
                                    <span className="text-gray-600">— {log.msg}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Glow under card */}
                    <div className="absolute -bottom-6 left-1/4 right-1/4 h-12 bg-brand-500/20 blur-2xl rounded-full pointer-events-none" />
                </div>
            </section>

            {/* ── Features ─────────────────────────────────────────────────── */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-3">Everything you need to automate</h2>
                        <p className="text-gray-500 max-w-xl mx-auto">From simple triggers to complex multi-step AI pipelines — AgentWeave handles it all.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {FEATURES.map((f) => {
                            const Icon = f.icon;
                            return (
                                <div key={f.title} className="glass-card p-5 hover:border-white/10 transition-all hover:shadow-glow-sm group">
                                    <div className={`w-10 h-10 rounded-xl border ${f.bg} flex items-center justify-center mb-4`}>
                                        <Icon className={`w-5 h-5 ${f.color}`} />
                                    </div>
                                    <h3 className="font-semibold text-white text-sm mb-2">{f.title}</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Node types ───────────────────────────────────────────────── */}
            <section className="py-16 px-6 border-y border-white/[0.04] bg-surface-800/30">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold mb-6">Built-in node types</p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {NODE_PALETTE.map(({ type, color, icon: Icon }) => (
                            <div key={type} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${color}`}>
                                <Icon className="w-3 h-3" />
                                {type}
                            </div>
                        ))}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-gray-500">
                            + more coming
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA banner ───────────────────────────────────────────────── */}
            <section className="py-24 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="glass-card p-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-purple-500/5 to-teal-500/5 pointer-events-none" />
                        <div className="relative">
                            <h2 className="text-3xl font-bold text-white mb-3">Ready to automate?</h2>
                            <p className="text-gray-400 mb-8">Create your first workflow in minutes. No setup, no credit card.</p>
                            <button
                                onClick={handleCTA}
                                className="btn-primary px-8 py-3 text-sm font-semibold mx-auto shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 hover:scale-[1.02] transition-all"
                            >
                                <Zap className="w-4 h-4" />
                                {isLoaded && isSignedIn ? "Go to Dashboard" : "Get Started Free"}
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <footer className="border-t border-white/[0.05] py-8 px-6 text-center">
                <p className="text-xs text-gray-600">
                    © 2026 AgentWeave · Built with Next.js, FastAPI &amp; ♥
                </p>
            </footer>
        </div>
    );
}
