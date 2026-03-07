"use client";

import { useAuth } from "@clerk/nextjs";
import { setTokenGetter } from "@/lib/api";

/**
 * Registers the Clerk token getter with the Axios interceptor.
 *
 * IMPORTANT: setTokenGetter() is called synchronously during render
 * (not in useEffect) so the getter is always ready before any child
 * page component mounts and fires its first useEffect API call.
 *
 * React renders parents before children, so by the time any child
 * page's useEffect runs, this component has already set _getToken.
 */
export default function AuthenticatedApiProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { getToken } = useAuth();

    // Synchronous — intentionally NOT in useEffect
    setTokenGetter(getToken);

    return <>{children}</>;
}
