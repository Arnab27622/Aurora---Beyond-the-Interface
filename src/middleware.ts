import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
    function middleware(req: NextRequest) {
        const res = NextResponse.next();

        // Content Security Policy headers
        const cspHeader = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self' https://generativelanguage.googleapis.com",
            "media-src 'self'",
            "object-src 'none'",
            "frame-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
        ].join('; ');

        res.headers.set('Content-Security-Policy', cspHeader);

        // Additional security headers
        res.headers.set('X-Frame-Options', 'DENY');
        res.headers.set('X-Content-Type-Options', 'nosniff');
        res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        return res;
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: ['/api/chat/:path*'],
};
