/**
 * AuthProvider Component
 * 
 * Root wrapper component that provides NextAuth session management.
 * Wraps the entire application to enable authentication functionality.
 * Features:
 * - Session provider from NextAuth for user authentication
 * - Suspense boundary for handling async operations
 * - Configured with API auth path and no refetch interval
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import { Suspense } from 'react';

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    return (
        <SessionProvider basePath="/api/auth" refetchInterval={0}>
            <Suspense fallback={null}>
                {children}
            </Suspense>
        </SessionProvider>
    );
}
