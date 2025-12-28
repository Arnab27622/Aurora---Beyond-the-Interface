'use client';

import { SessionProvider } from 'next-auth/react';
import { Suspense } from 'react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider basePath="/api/auth" refetchInterval={0}>
            <Suspense fallback={null}>
                {children}
            </Suspense>
        </SessionProvider>
    );
}
