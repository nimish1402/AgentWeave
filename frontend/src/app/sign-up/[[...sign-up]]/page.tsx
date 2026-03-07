"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center">
            {/* Logo mark */}
            <div className="mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                </div>
                <span className="font-bold text-2xl text-white tracking-tight">
                    Agent<span className="text-brand-400">Weave</span>
                </span>
            </div>
            <SignUp
                appearance={{
                    elements: {
                        card: "bg-surface-800 border border-white/[0.06] shadow-xl shadow-black/40 rounded-2xl",
                        headerTitle: "text-white font-bold",
                        headerSubtitle: "text-gray-400",
                        socialButtonsBlockButton: "bg-surface-700 border border-white/[0.08] text-gray-200 hover:bg-surface-600 transition-colors",
                        dividerLine: "bg-white/[0.08]",
                        dividerText: "text-gray-500",
                        formFieldLabel: "text-gray-300 text-sm",
                        formFieldInput: "bg-surface-700 border-white/[0.1] text-white rounded-lg focus:border-brand-500 focus:ring-brand-500/20",
                        formButtonPrimary: "bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors",
                        footerActionLink: "text-brand-400 hover:text-brand-300",
                    },
                }}
            />
        </div>
    );
}
