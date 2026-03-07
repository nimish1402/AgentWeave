"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
    LayoutDashboard,
    Wand2,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/generate", icon: Wand2, label: "AI Generator" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-60 flex-shrink-0 h-screen bg-surface-800 border-r border-white/[0.06] flex flex-col">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-white/[0.06]">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow-sm">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-lg text-white tracking-tight">
                        Agent<span className="text-brand-400">Weave</span>
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map(({ href, icon: Icon, label }) => {
                    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                                active
                                    ? "bg-brand-500/15 text-brand-400 border border-brand-500/25"
                                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* User profile + sign-out */}
            <div className="px-4 py-4 border-t border-white/[0.06] flex items-center gap-3">
                <UserButton
                    afterSignOutUrl="/sign-in"
                    appearance={{
                        elements: {
                            avatarBox: "w-8 h-8 ring-2 ring-white/10 hover:ring-brand-500/40 transition-all",
                            userButtonPopoverCard: "bg-surface-800 border border-white/[0.08] shadow-xl",
                            userButtonPopoverActionButton: "text-gray-300 hover:text-white hover:bg-white/[0.04]",
                            userButtonPopoverActionButtonText: "text-gray-300",
                            userButtonPopoverFooter: "hidden",
                        },
                    }}
                />
                <span className="text-xs text-gray-500">Account</span>
            </div>
        </aside>
    );
}
