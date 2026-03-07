import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import AuthenticatedApiProvider from "@/components/AuthenticatedApiProvider";

export const metadata: Metadata = {
    title: "AgentWeave – AI Workflow Platform",
    description:
        "Build AI-powered automation workflows with natural language. Generate, edit, and run visual node workflows.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider>
            <html lang="en" className="dark">
                <head>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                </head>
                <body className="font-sans bg-surface-900 text-gray-100 min-h-screen">
                    <AuthenticatedApiProvider>
                        {children}
                    </AuthenticatedApiProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
